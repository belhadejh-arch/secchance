import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { authenticateToken, AuthenticatedRequest, createAuditLog, createNotification } from '../middleware';

const router = Router();

// Calculate target response hours from priority
function getTargetResponseHours(priority: string): number {
  switch (priority) {
    case 'Critical': return 2;
    case 'High': return 24;
    case 'Medium': return 72;
    case 'Low': return 168; // 1 week
    default: return 72;
  }
}

// List cases according to strict user role & policy
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let sql = `
    SELECT c.*,
           at.name_ar as addiction_type_name,
           u_created.first_name as creator_first_name, u_created.last_name as creator_last_name,
           u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
           u_psy.first_name as psy_first_name, u_psy.last_name as psy_last_name,
           u_lawyer.first_name as lawyer_first_name, u_lawyer.last_name as lawyer_last_name,
           tc.name as center_name,
           (SELECT progress_percentage FROM case_progress WHERE case_file_id = c.id ORDER BY id DESC LIMIT 1) as latest_progress
    FROM case_files c
    LEFT JOIN addiction_types at ON c.addiction_type_id = at.id
    LEFT JOIN users u_created ON c.created_by = u_created.id
    LEFT JOIN users u_patient ON c.patient_id = u_patient.id
    LEFT JOIN users u_psy ON c.assigned_psychologist_id = u_psy.id
    LEFT JOIN users u_lawyer ON c.assigned_lawyer_id = u_lawyer.id
    LEFT JOIN centers tc ON c.treatment_center_id = tc.user_id
  `;

  const params: any[] = [];

  // Enforce isolation
  if (user.role_slug === 'family' || user.role_slug === 'patient') {
    sql += ' WHERE c.created_by = ? OR c.patient_id = ?';
    params.push(user.id, user.id);
  } else if (user.role_slug === 'psychologist') {
    sql += ' WHERE c.assigned_psychologist_id = ?';
    params.push(user.id);
  } else if (user.role_slug === 'lawyer') {
    sql += ' WHERE c.assigned_lawyer_id = ?';
    params.push(user.id);
  } else if (user.role_slug === 'treatment_center') {
    sql += ' WHERE c.treatment_center_id = ?';
    params.push(user.id);
  } else if (user.role_slug === 'association') {
    sql += ' WHERE EXISTS (SELECT 1 FROM case_assignments ca WHERE ca.case_file_id = c.id AND ca.specialist_id = ?)';
    params.push(user.id);
  } else if (user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'غير مصرح لك بعرض الحالات' });
    return;
  }

  // Priority ordering: Critical first, then High, Medium, Low
  sql += `
    ORDER BY 
      CASE c.priority 
        WHEN 'Critical' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        WHEN 'Low' THEN 4 
        ELSE 5 
      END ASC,
      c.id DESC
  `;

  const cases = query(sql, params);

  res.json({
    success: true,
    message: 'قائمة الحالات المصرح بها',
    data: cases
  });
});

// Create new case
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { addiction_type_id, description, priority, is_for_self, patient_name, documents } = req.body;

  // Validation
  const errors: Record<string, string> = {};
  if (!addiction_type_id) errors.addiction_type_id = 'يرجى اختيار نوع المشكلة';
  if (!description || description.trim().length < 15) errors.description = 'يرجى كتابة وصف وافٍ للحالة لا يقل عن 15 حرفاً';
  if (!priority || !['Critical', 'High', 'Medium', 'Low'].includes(priority)) errors.priority = 'يرجى تحديد درجة الأولوية';

  if (Object.keys(errors).length > 0) {
    res.status(422).json({
      success: false,
      message: 'بيانات الحالة غير مكتملة',
      errors
    });
    return;
  }

  const patientId = is_for_self ? user.id : user.id; // linked patient
  const targetResponseHours = getTargetResponseHours(priority);

  // Generate Unique Case Number: SCP-2026-XXXXX
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const numberCase = `SCP-2026-${randomSuffix}`;

  const { lastInsertRowId } = execute(`
    INSERT INTO case_files (
      number_case, created_by, patient_id, addiction_type_id, priority, status, description, target_response_hours
    ) VALUES (?, ?, ?, ?, ?, 'NEW', ?, ?)
  `, [numberCase, user.id, patientId, addiction_type_id, priority, description.trim(), targetResponseHours]);

  const caseId = lastInsertRowId;

  // Create conversation for this case
  execute(`INSERT INTO conversations (case_file_id, title) VALUES (?, ?)`, [caseId, `محادثة الملف ${numberCase}`]);
  const conv = queryOne<{ id: number }>('SELECT id FROM conversations WHERE case_file_id = ?', [caseId]);
  if (conv) {
    execute(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)`, [conv.id, user.id]);
  }

  // Insert initial documents if any
  if (Array.isArray(documents)) {
    documents.forEach((doc: any) => {
      if (doc.file_name && doc.storage_path) {
        execute(`
          INSERT INTO case_documents (case_file_id, uploaded_by, file_name, file_type, file_size, storage_path, visibility)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [caseId, user.id, doc.file_name, doc.file_type || 'document', doc.file_size || 1024, doc.storage_path, doc.visibility || 'all']);
      }
    });
  }

  // Notifications
  createNotification(
    user.id,
    'تم تسجيل طلبك بنجاح',
    `تم إنشاء ملف الحالة رقم ${numberCase} بنجاح، ويجري مراجعته حالياً من قبل فريق الاستقبال والمراجعة.`,
    'case_created',
    `/dashboard/case/${caseId}`
  );

  // Notify admins
  const admins = query<{ id: number }>('SELECT id FROM users WHERE role_slug = "admin"');
  admins.forEach(admin => {
    createNotification(
      admin.id,
      priority === 'Critical' ? '⚠️ تنبيه: حالة حرجة جديدة!' : 'ملف حالة جديد بانتظار المراجعة',
      `تم تسجيل طلب حالة جديد برقم ${numberCase} بأولوية ${priority}. زمن الاستجابة المستهدف: ${targetResponseHours} ساعة.`,
      'admin_case',
      `/dashboard/admin/cases/${caseId}`
    );
  });

  createAuditLog(user.id, 'CREATE_CASE', 'case_files', caseId, `إنشاء حالة برقم ${numberCase} وأولوية ${priority}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'تم إرسال طلب المساعدة بنجاح',
    data: {
      case_id: caseId,
      number_case: numberCase,
      priority,
      target_response_hours: targetResponseHours,
      status: 'NEW'
    }
  });
});

// Get case details by ID
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const caseId = Number(req.params.id);

  const caseFile = queryOne<any>(`
    SELECT c.*,
           at.name_ar as addiction_type_name,
           at.description as addiction_type_desc,
           u_created.first_name as creator_first_name, u_created.last_name as creator_last_name, u_created.phone as creator_phone, u_created.email as creator_email,
           u_patient.first_name as patient_first_name, u_patient.last_name as patient_last_name,
           u_psy.first_name as psy_first_name, u_psy.last_name as psy_last_name,
           u_lawyer.first_name as lawyer_first_name, u_lawyer.last_name as lawyer_last_name,
           tc.name as center_name, tc.phone as center_phone,
           w.name_ar as wilaya_name
    FROM case_files c
    LEFT JOIN addiction_types at ON c.addiction_type_id = at.id
    LEFT JOIN users u_created ON c.created_by = u_created.id
    LEFT JOIN users u_patient ON c.patient_id = u_patient.id
    LEFT JOIN users u_psy ON c.assigned_psychologist_id = u_psy.id
    LEFT JOIN users u_lawyer ON c.assigned_lawyer_id = u_lawyer.id
    LEFT JOIN centers tc ON c.treatment_center_id = tc.user_id
    LEFT JOIN wilayas w ON u_created.wilaya_id = w.id
    WHERE c.id = ?
  `, [caseId]);

  if (!caseFile) {
    res.status(404).json({ success: false, message: 'ملف الحالة غير موجود' });
    return;
  }

  // Access policy check
  const isCreatorOrPatient = caseFile.created_by === user.id || caseFile.patient_id === user.id;
  const isAssignedPsy = caseFile.assigned_psychologist_id === user.id;
  const isAssignedLawyer = caseFile.assigned_lawyer_id === user.id;
  const isAssignedCenter = caseFile.treatment_center_id === user.id;
  const isAdmin = user.role_slug === 'admin';

  if (!isCreatorOrPatient && !isAssignedPsy && !isAssignedLawyer && !isAssignedCenter && !isAdmin) {
    res.status(403).json({ success: false, message: 'غير مصرح لك بالوصول إلى هذا الملف' });
    return;
  }

  // Fetch assessments (Psychologist & Admin only, or summary for family)
  let assessments: any[] = [];
  if (isAssignedPsy || isAdmin || isCreatorOrPatient) {
    assessments = query(`
      SELECT a.*, u.first_name, u.last_name
      FROM assessments a
      JOIN users u ON a.psychologist_id = u.id
      WHERE a.case_file_id = ?
      ORDER BY a.id DESC
    `, [caseId]);
  }

  // Treatment plans
  const treatmentPlans = query(`SELECT * FROM treatment_plans WHERE case_file_id = ? ORDER BY id DESC`, [caseId]);

  // Therapy sessions (Private medical notes hidden from Lawyer)
  let therapySessions = query(`SELECT * FROM therapy_sessions WHERE case_file_id = ? ORDER BY session_number ASC`, [caseId]);
  if (isAssignedLawyer) {
    // Hide clinical notes from lawyer
    therapySessions = therapySessions.map(s => ({
      ...s,
      notes: '[ملاحظات طبية نفسية سرية خاصة بالأخصائي المعالج]'
    }));
  }

  // Progress history
  const progressHistory = query(`
    SELECT cp.*, u.first_name, u.last_name
    FROM case_progress cp
    JOIN users u ON cp.updated_by = u.id
    WHERE cp.case_file_id = ?
    ORDER BY cp.id DESC
  `, [caseId]);

  // Documents with visibility checks
  let documents = query(`
    SELECT cd.*, u.first_name as uploader_name
    FROM case_documents cd
    JOIN users u ON cd.uploaded_by = u.id
    WHERE cd.case_file_id = ?
    ORDER BY cd.id DESC
  `, [caseId]);

  if (isAssignedLawyer) {
    documents = documents.filter(d => d.visibility === 'all' || d.visibility === 'legal_only');
  } else if (isAssignedPsy) {
    documents = documents.filter(d => d.visibility === 'all' || d.visibility === 'medical_only');
  }

  // Appointments
  const appointments = query(`
    SELECT a.*, u.first_name as specialist_first_name, u.last_name as specialist_last_name
    FROM appointments a
    JOIN users u ON a.specialist_id = u.id
    WHERE a.case_file_id = ?
    ORDER BY a.appointment_date ASC, a.start_time ASC
  `, [caseId]);

  // Legal consultations
  const legalConsultations = query(`
    SELECT lc.*, u.first_name as lawyer_first_name, u.last_name as lawyer_last_name
    FROM legal_consultations lc
    JOIN users u ON lc.lawyer_id = u.id
    WHERE lc.case_file_id = ?
    ORDER BY lc.id DESC
  `, [caseId]);

  // Treatment follow-ups
  const treatmentFollowUps = query(`
    SELECT tf.*, c.name as center_name
    FROM treatment_follow_ups tf
    JOIN centers c ON tf.center_id = c.user_id
    WHERE tf.case_file_id = ?
    ORDER BY tf.week_number ASC
  `, [caseId]);

  // Ratings
  const ratings = query(`SELECT * FROM ratings WHERE case_file_id = ?`, [caseId]);

  // Conversation info
  const conversation = queryOne(`SELECT id, title FROM conversations WHERE case_file_id = ?`, [caseId]);

  res.json({
    success: true,
    message: 'تفاصيل ملف الحالة',
    data: {
      case: caseFile,
      assessments,
      treatment_plans: treatmentPlans,
      therapy_sessions: therapySessions,
      progress_history: progressHistory,
      documents,
      appointments,
      legal_consultations: legalConsultations,
      treatment_follow_ups: treatmentFollowUps,
      ratings,
      conversation_id: conversation ? conversation.id : null
    }
  });
});

// Update Case Status (Workflow Transition)
router.put('/:id/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const caseId = Number(req.params.id);
  const { status, note } = req.body;

  const validStatuses = [
    'NEW', 'UNDER_REVIEW', 'ASSIGNED', 'FIRST_SESSION', 'FOLLOW_UP', 'REFERRED', 'COMPLETED', 'ARCHIVED'
  ];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, message: 'حالة غير صالحة' });
    return;
  }

  const caseFile = queryOne<any>('SELECT * FROM case_files WHERE id = ?', [caseId]);
  if (!caseFile) {
    res.status(404).json({ success: false, message: 'الملف غير موجود' });
    return;
  }

  // Mandatory Business Rule 3: Cannot close/complete case without final evaluation report!
  if (status === 'COMPLETED') {
    const treatmentPlan = queryOne<any>('SELECT final_evaluation FROM treatment_plans WHERE case_file_id = ? AND final_evaluation IS NOT NULL AND length(trim(final_evaluation)) > 10', [caseId]);
    if (!treatmentPlan) {
      res.status(422).json({
        success: false,
        message: 'قاعدة تنظيمية إلزامية: لا يمكن إغلاق الحالة أو وضعها كمكتملة دون استكمال التقرير النهائي والتقييم الختامي في الخطة العلاجية.',
        errors: { report: 'Final evaluation report required before completion' }
      });
      return;
    }
  }

  // Update status
  execute('UPDATE case_files SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, caseId]);

  if (note) {
    execute('INSERT INTO case_notes (case_file_id, user_id, note) VALUES (?, ?, ?)', [caseId, user.id, note]);
  }

  // Notify creator
  createNotification(
    caseFile.created_by,
    'تحديث حالة ملفك',
    `تم تغيير حالة ملفك رقم ${caseFile.number_case} إلى: ${status}`,
    'status_update',
    `/dashboard/case/${caseId}`
  );

  createAuditLog(user.id, 'CHANGE_STATUS', 'case_files', caseId, `تغيير الحالة من ${caseFile.status} إلى ${status}`, req.ip);

  res.json({
    success: true,
    message: `تم تحديث حالة الملف إلى ${status} بنجاح`
  });
});

// Assign Specialist / Entity
router.post('/:id/assign', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'تخصيص وإسناد الحالات مخصص لإدارة المنصة والمشرفين فقط' });
    return;
  }

  const caseId = Number(req.params.id);
  const { specialist_id, role_type, notes } = req.body;

  if (!specialist_id || !role_type) {
    res.status(422).json({ success: false, message: 'يرجى تحديد المختص ونوع الإسناد' });
    return;
  }

  const caseFile = queryOne<any>('SELECT * FROM case_files WHERE id = ?', [caseId]);
  if (!caseFile) {
    res.status(404).json({ success: false, message: 'الملف غير موجود' });
    return;
  }

  // Update specific column in case_files
  if (role_type === 'psychologist') {
    execute("UPDATE case_files SET assigned_psychologist_id = ?, status = CASE WHEN status = 'NEW' THEN 'ASSIGNED' ELSE status END WHERE id = ?", [specialist_id, caseId]);
  } else if (role_type === 'lawyer') {
    execute('UPDATE case_files SET assigned_lawyer_id = ? WHERE id = ?', [specialist_id, caseId]);
  } else if (role_type === 'treatment_center') {
    execute('UPDATE case_files SET treatment_center_id = ? WHERE id = ?', [specialist_id, caseId]);
  }

  // Record assignment in log
  execute(`
    INSERT INTO case_assignments (case_file_id, specialist_id, assigned_by, role_type, status, notes)
    VALUES (?, ?, ?, ?, 'accepted', ?)
  `, [caseId, specialist_id, user.id, role_type, notes || 'إسناد معتمد من الإدارة']);

  // Add specialist to conversation
  const conv = queryOne<{ id: number }>('SELECT id FROM conversations WHERE case_file_id = ?', [caseId]);
  if (conv) {
    const existing = queryOne('SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [conv.id, specialist_id]);
    if (!existing) {
      execute('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', [conv.id, specialist_id]);
    }
  }

  // Notify specialist
  createNotification(
    specialist_id,
    'إسناد حالة جديدة',
    `تم إسناد ملف الحالة رقم ${caseFile.number_case} إليك. يرجى مراجعة التفاصيل ومباشرة الإجراءات.`,
    'case_assigned',
    `/dashboard/specialist/cases`
  );

  // Notify user
  createNotification(
    caseFile.created_by,
    'تم إسناد ملفك لمختص معتمد',
    `تم توجيه ملفك رقم ${caseFile.number_case} إلى مختص معتمد لمتابعة حالتك.`,
    'case_assigned',
    `/dashboard/case/${caseId}`
  );

  createAuditLog(user.id, 'ASSIGN_SPECIALIST', 'case_files', caseId, `إسناد المختص رقم ${specialist_id} بدور ${role_type}`, req.ip);

  res.json({
    success: true,
    message: 'تم إسناد الحالة بنجاح'
  });
});

// Add document to case
router.post('/:id/documents', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const caseId = Number(req.params.id);
  const { file_name, file_type, file_size, storage_path, visibility } = req.body;

  if (!file_name || !storage_path) {
    res.status(422).json({ success: false, message: 'بيانات الوثيقة غير مكتملة' });
    return;
  }

  execute(`
    INSERT INTO case_documents (case_file_id, uploaded_by, file_name, file_type, file_size, storage_path, visibility)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [caseId, user.id, file_name, file_type || 'document', file_size || 1024, storage_path, visibility || 'all']);

  createAuditLog(user.id, 'UPLOAD_DOCUMENT', 'case_documents', caseId, `رفع مستند جديد: ${file_name}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'تم رفع المستند بنجاح'
  });
});

// Rate Case Service
router.post('/:id/rate', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const caseId = Number(req.params.id);
  const { rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(422).json({ success: false, message: 'التقييم يجب أن يكون من 1 إلى 5 نجوم' });
    return;
  }

  execute(`
    INSERT INTO ratings (case_file_id, user_id, rating, feedback)
    VALUES (?, ?, ?, ?)
  `, [caseId, user.id, rating, feedback || null]);

  res.status(201).json({
    success: true,
    message: 'شكراً جزيلاً لتقييمك وملاحظاتك القيمة للمنصة'
  });
});

export default router;
