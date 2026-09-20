import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { authenticateToken, AuthenticatedRequest, createAuditLog, createNotification } from '../middleware';

const router = Router();

// Helper to check for overlapping appointment times
function hasTimeConflict(specialistId: number, date: string, startTime: string, endTime: string, excludeAppointmentId?: number): boolean {
  let sql = `
    SELECT id, start_time, end_time FROM appointments
    WHERE specialist_id = ?
      AND appointment_date = ?
      AND status IN ('CONFIRMED', 'PENDING')
  `;
  const params: any[] = [specialistId, date];

  if (excludeAppointmentId) {
    sql += ' AND id != ?';
    params.push(excludeAppointmentId);
  }

  const existing = query<{ id: number; start_time: string; end_time: string }>(sql, params);
  
  // Overlap condition: startA < endB && endA > startB
  return existing.some(app => {
    return (startTime < app.end_time && endTime > app.start_time);
  });
}

// Get Appointments
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let sql = `
    SELECT a.*,
           c.number_case,
           u_created.first_name as creator_first_name, u_created.last_name as creator_last_name, u_created.phone as creator_phone,
           u_spec.first_name as specialist_first_name, u_spec.last_name as specialist_last_name, u_spec.phone as specialist_phone,
           sp.specialty
    FROM appointments a
    JOIN case_files c ON a.case_file_id = c.id
    JOIN users u_created ON a.created_by = u_created.id
    JOIN users u_spec ON a.specialist_id = u_spec.id
    LEFT JOIN specialist_profiles sp ON u_spec.id = sp.user_id
  `;

  const params: any[] = [];
  if (user.role_slug === 'family' || user.role_slug === 'patient') {
    sql += ' WHERE a.created_by = ? OR c.patient_id = ?';
    params.push(user.id, user.id);
  } else if (['psychologist', 'lawyer', 'treatment_center', 'association'].includes(user.role_slug)) {
    sql += ' WHERE a.specialist_id = ?';
    params.push(user.id);
  } else if (user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'غير مصرح لك بعرض المواعيد' });
    return;
  }

  sql += ' ORDER BY a.appointment_date ASC, a.start_time ASC';
  const appointments = query(sql, params);

  res.json({
    success: true,
    message: 'قائمة المواعيد',
    data: appointments
  });
});

// Create Appointment with Conflict Prevention
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { case_file_id, specialist_id, appointment_date, start_time, end_time, type, notes } = req.body;

  // Validation
  const errors: Record<string, string> = {};
  if (!case_file_id) errors.case_file_id = 'يرجى تحديد ملف الحالة';
  if (!specialist_id) errors.specialist_id = 'يرجى تحديد المختص المعني';
  if (!appointment_date) errors.appointment_date = 'يرجى تحديد تاريخ الموعد';
  if (!start_time || !end_time) errors.time = 'يرجى تحديد وقت بداية ونهاية الموعد';
  if (start_time && end_time && start_time >= end_time) errors.time = 'وقت نهاية الموعد يجب أن يكون بعد وقت البداية';

  if (Object.keys(errors).length > 0) {
    res.status(422).json({
      success: false,
      message: 'بيانات الموعد غير صالحة',
      errors
    });
    return;
  }

  // Conflict Prevention Check (Rule 8)
  const isConflict = hasTimeConflict(specialist_id, appointment_date, start_time, end_time);
  if (isConflict) {
    res.status(409).json({
      success: false,
      message: 'تعارض في التوقيت: المختص لديه موعد آخر مؤكد في نفس التوقيت والتاريخ. يرجى اختيار وقت آخر متاح.',
      errors: { conflict: 'Specialist already has a scheduled appointment during this time window' }
    });
    return;
  }

  const { lastInsertRowId } = execute(`
    INSERT INTO appointments (case_file_id, created_by, specialist_id, appointment_date, start_time, end_time, type, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
  `, [case_file_id, user.id, specialist_id, appointment_date, start_time, end_time, type || 'psychological', notes || null]);

  const appointmentId = lastInsertRowId;

  // Notify specialist & user
  createNotification(
    specialist_id,
    'موعد جديد مؤكد',
    `تم حجز موعد جديد معك بتاريخ ${appointment_date} من الساعة ${start_time} إلى ${end_time}.`,
    'appointment',
    `/dashboard/appointments`
  );

  createNotification(
    user.id,
    'تم تأكيد حجز الموعد',
    `تم تسجيل موعدك بنجاح بتاريخ ${appointment_date} في تمام الساعة ${start_time}.`,
    'appointment',
    `/dashboard/appointments`
  );

  createAuditLog(user.id, 'CREATE_APPOINTMENT', 'appointments', appointmentId, `حجز موعد بتاريخ ${appointment_date} مع المختص ${specialist_id}`, req.ip);

  res.status(201).json({
    success: true,
    message: 'تم حجز الموعد بنجاح دون أي تعارض زمني',
    data: { id: appointmentId }
  });
});

// Update Appointment Status (confirm, cancel, reschedule, complete)
router.put('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const appointmentId = Number(req.params.id);
  const { status, cancellation_reason, appointment_date, start_time, end_time, notes } = req.body;

  const app = queryOne<any>('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
  if (!app) {
    res.status(404).json({ success: false, message: 'الموعد غير موجود' });
    return;
  }

  // Rescheduling conflict check
  if (appointment_date && start_time && end_time) {
    const isConflict = hasTimeConflict(app.specialist_id, appointment_date, start_time, end_time, appointmentId);
    if (isConflict) {
      res.status(409).json({
        success: false,
        message: 'تعارض في التوقيت الجديد: المختص لديه موعد آخر في هذا الوقت.',
        errors: { conflict: 'Time conflict upon reschedule' }
      });
      return;
    }
  }

  execute(`
    UPDATE appointments
    SET status = COALESCE(?, status),
        cancellation_reason = COALESCE(?, cancellation_reason),
        appointment_date = COALESCE(?, appointment_date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        notes = COALESCE(?, notes)
    WHERE id = ?
  `, [status, cancellation_reason, appointment_date, start_time, end_time, notes, appointmentId]);

  createAuditLog(user.id, 'UPDATE_APPOINTMENT', 'appointments', appointmentId, `تحديث حالة الموعد إلى ${status || 'معدل'}`, req.ip);

  res.json({
    success: true,
    message: 'تم تحديث الموعد بنجاح'
  });
});

export default router;
