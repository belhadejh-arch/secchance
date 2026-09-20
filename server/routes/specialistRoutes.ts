import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { authenticateToken, AuthenticatedRequest, createAuditLog, createNotification } from '../middleware';

const router = Router();

// Public / Authenticated list of approved specialists for selection
router.get('/list', (req, res: Response) => {
  const specialists = query(`
    SELECT u.id, u.first_name, u.last_name, u.role_slug, u.phone,
           w.name_ar as wilaya_name,
           sp.specialty, sp.years_of_experience, sp.bio, sp.availability_schedule
    FROM users u
    JOIN specialist_profiles sp ON u.id = sp.user_id
    LEFT JOIN wilayas w ON u.wilaya_id = w.id
    WHERE u.status = 'active' AND sp.verification_status = 'approved'
  `);

  res.json({
    success: true,
    message: 'قائمة المختصين المعتمدين',
    data: specialists
  });
});

// Psychologist: Add Initial Assessment
router.post('/assessments', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role_slug !== 'psychologist' && user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'مخصص للأخصائيين النفسيين المعتمدين' });
    return;
  }

  const { case_file_id, severity, recommendation, mental_health_notes } = req.body;
  if (!case_file_id || !severity || !recommendation) {
    res.status(422).json({ success: false, message: 'يرجى إكمال بيانات التقييم الأولي' });
    return;
  }

  const { lastInsertRowId } = execute(`
    INSERT INTO assessments (case_file_id, psychologist_id, severity, recommendation, mental_health_notes)
    VALUES (?, ?, ?, ?, ?)
  `, [case_file_id, user.id, severity, recommendation, mental_health_notes || null]);

  // Update case status if in ASSIGNED
  execute(`UPDATE case_files SET status = 'FIRST_SESSION', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'ASSIGNED'`, [case_file_id]);

  createAuditLog(user.id, 'ADD_ASSESSMENT', 'assessments', lastInsertRowId, `إضافة تقييم نفسي بمستوى شدة: ${severity}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'تم حفظ التقييم الأولي بنجاح',
    data: { id: lastInsertRowId }
  });
});

// Psychologist: Create Treatment Plan
router.post('/treatment-plans', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role_slug !== 'psychologist' && user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'مخصص للأخصائيين النفسيين' });
    return;
  }

  const { case_file_id, goal, strategy, duration, sessions_count } = req.body;
  if (!case_file_id || !goal || !strategy) {
    res.status(422).json({ success: false, message: 'يرجى إدخال أهداف واستراتيجية الخطة العلاجية' });
    return;
  }

  const { lastInsertRowId } = execute(`
    INSERT INTO treatment_plans (case_file_id, goal, strategy, duration, sessions_count)
    VALUES (?, ?, ?, ?, ?)
  `, [case_file_id, goal, strategy, duration || '3 أشهر', sessions_count || 8]);

  createAuditLog(user.id, 'CREATE_TREATMENT_PLAN', 'treatment_plans', lastInsertRowId, `إنشاء خطة علاجية للحالة ${case_file_id}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الخطة العلاجية بنجاح',
    data: { id: lastInsertRowId }
  });
});

// Psychologist: Update Final Evaluation in Treatment Plan (Requirement for closing case)
router.put('/treatment-plans/:id/final-eval', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const planId = Number(req.params.id);
  const { final_evaluation } = req.body;

  if (!final_evaluation || final_evaluation.trim().length < 20) {
    res.status(422).json({
      success: false,
      message: 'التقرير الختامي والتقييم النهائي إلزامي ويجب ألا يقل عن 20 حرفاً متضمناً ما تم إنجازه وخطة المتابعة والقرار المهني.'
    });
    return;
  }

  execute(`UPDATE treatment_plans SET final_evaluation = ? WHERE id = ?`, [final_evaluation.trim(), planId]);

  createAuditLog(user.id, 'UPDATE_FINAL_EVALUATION', 'treatment_plans', planId, 'تسجيل التقرير النهائي للخطة العلاجية', req.ip);

  res.json({
    success: true,
    message: 'تم تسجيل التقرير النهائي بنجاح. أصبحت الحالة مؤهلة للإغلاق المعتمد.'
  });
});

// Psychologist: Log Therapy Session
router.post('/sessions', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role_slug !== 'psychologist' && user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'مخصص للأخصائيين النفسيين' });
    return;
  }

  const { case_file_id, session_number, date, duration, notes, session_next } = req.body;
  if (!case_file_id || !session_number || !date || !notes) {
    res.status(422).json({ success: false, message: 'يرجى استكمال بيانات الجلسة والملاحظات المهنية' });
    return;
  }

  const { lastInsertRowId } = execute(`
    INSERT INTO therapy_sessions (case_file_id, session_number, date, duration, notes, session_next, status)
    VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')
  `, [case_file_id, session_number, date, duration || 45, notes, session_next || null]);

  createAuditLog(user.id, 'LOG_THERAPY_SESSION', 'therapy_sessions', lastInsertRowId, `تسجيل جلسة نفسية رقم ${session_number}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'تم حفظ بيانات وملاحظات الجلسة بنجاح'
  });
});

// Update Case Progress (0%, 10%, 25%, 50%, 75%, 100%)
router.post('/progress', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { case_file_id, progress_percentage, notes } = req.body;

  const validPercentages = [0, 10, 25, 50, 75, 100];
  if (!validPercentages.includes(Number(progress_percentage))) {
    res.status(422).json({
      success: false,
      message: 'النسبة يجب أن تكون إحدى القيم المعتمدة: 0%، 10%، 25%، 50%، 75%، 100%'
    });
    return;
  }

  execute(`
    INSERT INTO case_progress (case_file_id, progress_percentage, notes, updated_by)
    VALUES (?, ?, ?, ?)
  `, [case_file_id, Number(progress_percentage), notes || null, user.id]);

  // Notify creator
  const caseFile = queryOne<any>('SELECT * FROM case_files WHERE id = ?', [case_file_id]);
  if (caseFile) {
    createNotification(
      caseFile.created_by,
      'تحديث في تقدم التعافي',
      `تم تحديث نسبة تقدم الخطة العلاجية لملفك إلى ${progress_percentage}%.`,
      'progress_update',
      `/dashboard/case/${case_file_id}`
    );
  }

  res.status(201).json({
    success: true,
    message: `تم تحديث مؤشر التقدم إلى ${progress_percentage}% بنجاح`
  });
});

// Lawyer: Submit Legal Opinion
router.post('/legal-consultation', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role_slug !== 'lawyer' && user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'مخصص للمحامين والمستشارين القانونيين' });
    return;
  }

  const { case_file_id, legal_opinion, recommendation, status } = req.body;
  if (!case_file_id || !legal_opinion) {
    res.status(422).json({ success: false, message: 'يرجى إدخال الرأي القانوني' });
    return;
  }

  const { lastInsertRowId } = execute(`
    INSERT INTO legal_consultations (case_file_id, lawyer_id, status, legal_opinion, recommendation)
    VALUES (?, ?, ?, ?, ?)
  `, [case_file_id, user.id, status || 'COMPLETED', legal_opinion, recommendation || null]);

  createAuditLog(user.id, 'SUBMIT_LEGAL_OPINION', 'legal_consultations', lastInsertRowId, `إصدار استشارة ورأي قانوني للحالة ${case_file_id}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'تم تسجيل الرأي القانوني وإرسال التوصية بنجاح'
  });
});

// Treatment Center: Add Weekly Follow-up
router.post('/center-followup', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role_slug !== 'treatment_center' && user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'مخصص لمراكز علاج وتأهيل الإدمان' });
    return;
  }

  const { case_file_id, week_number, medical_notes, status_summary } = req.body;
  if (!case_file_id || !week_number || !medical_notes) {
    res.status(422).json({ success: false, message: 'يرجى إدخال المتابعة الأسبوعية والملاحظات الطبية' });
    return;
  }

  execute(`
    INSERT INTO treatment_follow_ups (case_file_id, center_id, week_number, medical_notes, status_summary)
    VALUES (?, ?, ?, ?, ?)
  `, [case_file_id, user.id, week_number, medical_notes, status_summary || 'مستمر في برنامج إزالة السموم']);

  res.status(201).json({
    success: true,
    message: `تم تسجيل تقرير الأسبوع ${week_number} بنجاح`
  });
});

export default router;
