import { Router, Response } from 'express';
import { query, queryOne, execute, executeBatch } from '../db';
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
    sql += ` WHERE (a.specialist_id = ? AND NOT EXISTS (
      SELECT 1 FROM service_requests sr0 WHERE sr0.appointment_id = a.id
    )) OR EXISTS (
      SELECT 1 FROM service_requests sr
      WHERE sr.appointment_id = a.id AND (
        sr.provider_id = ? OR (
          sr.assigned_staff_id = ? AND EXISTS (
            SELECT 1 FROM provider_staff ps WHERE ps.provider_id = sr.provider_id AND ps.staff_user_id = ? AND ps.is_active = 1
          )
        )
      )
    )`;
    params.push(user.id, user.id, user.id, user.id);
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
  const caseId = Number(case_file_id);
  const specialistId = Number(specialist_id);

  // Validation
  const errors: Record<string, string> = {};
  if (!Number.isInteger(caseId) || caseId < 1) errors.case_file_id = 'يرجى تحديد ملف الحالة';
  if (!Number.isInteger(specialistId) || specialistId < 1) errors.specialist_id = 'يرجى تحديد المختص المعني';
  if (!appointment_date) errors.appointment_date = 'يرجى تحديد تاريخ الموعد';
  if (appointment_date && !/^202[67]-\d{2}-\d{2}$/.test(appointment_date)) {
    errors.appointment_date = 'يجب أن يكون تاريخ الموعد خلال 2026 أو 2027';
  }
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

  const caseFile = queryOne<any>('SELECT * FROM case_files WHERE id = ?', [caseId]);
  if (!caseFile) {
    res.status(404).json({ success: false, message: 'ملف الحالة غير موجود' });
    return;
  }
  const linkedServiceRequest = queryOne<any>('SELECT * FROM service_requests WHERE case_file_id = ?', [caseId]);
  const isClient = caseFile.created_by === user.id || caseFile.patient_id === user.id;
  let specialistIsAssigned = false;
  let tentativeServiceAppointment = false;
  if (linkedServiceRequest) {
    if (!['ACCEPTED', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED'].includes(linkedServiceRequest.status)) {
      res.status(409).json({ success: false, message: 'Provider acceptance is required and canceled/rejected requests cannot be booked' });
      return;
    }
    if (linkedServiceRequest.appointment_id) {
      res.status(409).json({ success: false, message: 'This service request already has an appointment' });
      return;
    }
    const currentAssignee = Number(linkedServiceRequest.assigned_staff_id) || Number(linkedServiceRequest.provider_id);
    const assigneeIsActive = !linkedServiceRequest.assigned_staff_id ||
      !!queryOne('SELECT id FROM provider_staff WHERE provider_id = ? AND staff_user_id = ? AND is_active = 1',
        [linkedServiceRequest.provider_id, linkedServiceRequest.assigned_staff_id]);
    specialistIsAssigned = specialistId === currentAssignee && assigneeIsActive;
    tentativeServiceAppointment = !['PAID', 'NOT_REQUIRED'].includes(linkedServiceRequest.payment_status);
  } else {
    const assignedRecord = queryOne(`
      SELECT id FROM case_assignments WHERE case_file_id = ? AND specialist_id = ? AND status = 'accepted'
    `, [caseId, specialistId]);
    specialistIsAssigned = !!assignedRecord || caseFile.assigned_psychologist_id === specialistId ||
      caseFile.assigned_lawyer_id === specialistId || caseFile.treatment_center_id === specialistId;
  }
  const userIsAssignedSpecialist = user.id === specialistId && specialistIsAssigned &&
    ['psychologist', 'lawyer', 'treatment_center', 'association'].includes(user.role_slug);
  const userIsServiceProvider = linkedServiceRequest && linkedServiceRequest.provider_id === user.id;
  const specialist = queryOne<any>(`SELECT id, role_slug FROM users WHERE id = ? AND status = 'active' AND is_verified = 1`, [specialistId]);
  if (user.role_slug !== 'admin' && !(isClient && specialistIsAssigned) && !userIsAssignedSpecialist && !userIsServiceProvider) {
    res.status(403).json({ success: false, message: 'You may schedule only for a case you own or a case assigned to you' });
    return;
  }
  if (!specialist || !['psychologist', 'lawyer', 'treatment_center', 'association'].includes(specialist.role_slug)) {
    res.status(422).json({ success: false, message: 'Selected specialist is not active' });
    return;
  }
  // Conflict Prevention Check (Rule 8)
  const isConflict = hasTimeConflict(specialistId, appointment_date, start_time, end_time);
  if (isConflict) {
    res.status(409).json({
      success: false,
      message: 'تعارض في التوقيت: المختص لديه موعد آخر مؤكد في نفس التوقيت والتاريخ. يرجى اختيار وقت آخر متاح.',
      errors: { conflict: 'Specialist already has a scheduled appointment during this time window' }
    });
    return;
  }

  const appointmentStatus = tentativeServiceAppointment ? 'PENDING' : 'CONFIRMED';
  const appointmentSql = `INSERT INTO appointments (case_file_id, created_by, specialist_id, appointment_date, start_time, end_time, type, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`;
  const appointmentParams = [caseId, user.id, specialistId, appointment_date, start_time, end_time, type || 'psychological', appointmentStatus, notes || null];
  let appointmentId: number;
  if (linkedServiceRequest) {
    const created = executeBatch([
      { sql: appointmentSql, params: appointmentParams },
      {
        sql: `UPDATE service_requests SET appointment_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND appointment_id IS NULL AND status IN ('ACCEPTED','AWAITING_PAYMENT','PAID','CONFIRMED')`,
        params: [
          { __batchResult: 0, column: 'id' },
          tentativeServiceAppointment ? 'AWAITING_PAYMENT' : 'CONFIRMED',
          linkedServiceRequest.id,
        ],
        expectRowCount: 1,
      },
    ]);
    appointmentId = created[0].lastInsertRowId;
  } else {
    appointmentId = execute(appointmentSql, appointmentParams).lastInsertRowId;
  }

  // Notify specialist & user
  createNotification(
    specialistId,
    tentativeServiceAppointment ? 'موعد بانتظار الدفع' : 'موعد جديد مؤكد',
    `تم حجز موعد بتاريخ ${appointment_date} من الساعة ${start_time} إلى ${end_time}.`,
    'appointment',
    `/dashboard/appointments`
  );

  createNotification(
    linkedServiceRequest?.requester_id || caseFile.created_by,
    tentativeServiceAppointment ? 'موعدك بانتظار إتمام الدفع' : 'تم تأكيد حجز الموعد',
    `تم تسجيل موعدك بتاريخ ${appointment_date} في تمام الساعة ${start_time}.`,
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
  const caseFile = queryOne<any>('SELECT * FROM case_files WHERE id = ?', [app.case_file_id]);
  if (!caseFile) {
    res.status(404).json({ success: false, message: 'ملف الحالة المرتبط بالموعد غير موجود' });
    return;
  }
  const isClient = caseFile.created_by === user.id || caseFile.patient_id === user.id;
  const serviceRequest = queryOne<any>('SELECT * FROM service_requests WHERE appointment_id = ?', [appointmentId]);
  const serviceAssignee = serviceRequest && Number(serviceRequest.assigned_staff_id || serviceRequest.provider_id) === user.id &&
    (!serviceRequest.assigned_staff_id ||
      !!queryOne('SELECT id FROM provider_staff WHERE provider_id = ? AND staff_user_id = ? AND is_active = 1',
        [serviceRequest.provider_id, user.id]));
  const isSpecialist = app.specialist_id === user.id && (!serviceRequest || serviceAssignee);
  const affiliatedAssignee = serviceRequest && serviceRequest.assigned_staff_id === user.id &&
    !!queryOne('SELECT id FROM provider_staff WHERE provider_id = ? AND staff_user_id = ? AND is_active = 1',
      [serviceRequest.provider_id, user.id]);
  const isProvider = isSpecialist || !!affiliatedAssignee ||
    (serviceRequest && serviceRequest.provider_id === user.id);
  if (user.role_slug !== 'admin' && !isClient && !isProvider) {
    res.status(403).json({ success: false, message: 'You may not update this appointment' });
    return;
  }
  const allowedStatuses = ['CONFIRMED', 'PENDING', 'CANCELED', 'COMPLETED'];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    res.status(422).json({ success: false, message: 'Invalid appointment status' });
    return;
  }
  if (isClient && !isProvider && user.role_slug !== 'admin' && status && status !== 'CANCELED') {
    res.status(403).json({ success: false, message: 'Clients may only cancel their own appointment' });
    return;
  }
  if (status === 'CONFIRMED' && serviceRequest &&
      !['PAID', 'NOT_REQUIRED'].includes(serviceRequest.payment_status)) {
    res.status(409).json({ success: false, message: 'A service appointment cannot be confirmed before successful payment' });
    return;
  }
  if (status === 'COMPLETED' && serviceRequest &&
      !queryOne('SELECT id FROM service_reports WHERE request_id = ? AND final_evaluation IS NOT NULL AND length(trim(final_evaluation)) > 0',
        [serviceRequest.id])) {
    res.status(422).json({ success: false, message: 'A final evaluation report is required before completing this service' });
    return;
  }
  const hasAnyTime = appointment_date !== undefined || start_time !== undefined || end_time !== undefined;
  if (hasAnyTime && !(appointment_date && start_time && end_time)) {
    res.status(422).json({ success: false, message: 'Date, start_time and end_time must be supplied together' });
    return;
  }
  if (serviceRequest && status !== 'CANCELED' &&
      (!['ACCEPTED', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED'].includes(serviceRequest.status) ||
        ['REJECTED', 'CANCELED'].includes(serviceRequest.status))) {
    res.status(409).json({ success: false, message: 'The linked service request is not eligible for appointment updates' });
    return;
  }
  if (hasAnyTime && !isProvider && user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'Only the assigned specialist may reschedule' });
    return;
  }
  if (start_time && end_time && start_time >= end_time) {
    res.status(422).json({ success: false, message: 'End time must be after start time' });
    return;
  }

  if (appointment_date && !/^202[67]-\d{2}-\d{2}$/.test(appointment_date)) {
    res.status(422).json({
      success: false,
      message: 'تاريخ الموعد غير صالح',
      errors: { appointment_date: 'يجب أن يكون تاريخ الموعد خلال 2026 أو 2027' }
    });
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

  const updates = [{
    sql: `UPDATE appointments
      SET status = COALESCE(?, status),
          cancellation_reason = COALESCE(?, cancellation_reason),
          appointment_date = COALESCE(?, appointment_date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          notes = COALESCE(?, notes)
      WHERE id = ?`,
    params: [status, cancellation_reason, appointment_date, start_time, end_time, notes, appointmentId],
  }];
  if (serviceRequest) {
    if (status === 'CANCELED') {
      updates.push({
        sql: `UPDATE service_requests SET status = 'CANCELED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [serviceRequest.id],
      });
      updates.push({
        sql: `INSERT INTO refunds (payment_id, requested_by, amount_dzd, status, reason)
          SELECT p.id, ?, p.amount_dzd, 'REQUESTED', ? FROM payments p
          WHERE p.request_id = ? AND p.status = 'PAID'
            AND NOT EXISTS (SELECT 1 FROM refunds rf WHERE rf.payment_id = p.id)`,
        params: [user.id, cancellation_reason || 'Appointment canceled; refund review required', serviceRequest.id],
      });
    } else if (status === 'CONFIRMED') {
      updates.push({
        sql: `UPDATE service_requests SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [serviceRequest.id],
      });
    } else if (status === 'COMPLETED') {
      updates.push({
        sql: `UPDATE service_requests SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [serviceRequest.id],
      });
      updates.push({
        sql: `UPDATE case_files SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [caseFile.id],
      });
    }
  }
  executeBatch(updates);

  createNotification(
    isClient ? app.specialist_id : caseFile.created_by,
    'تم تحديث الموعد',
    `تم تحديث الموعد المرتبط بملف الحالة ${caseFile.number_case}.`,
    'appointment',
    '/dashboard/appointments',
  );
  createAuditLog(user.id, 'UPDATE_APPOINTMENT', 'appointments', appointmentId, `تحديث حالة الموعد إلى ${status || 'معدل'}`, req.ip);

  res.json({
    success: true,
    message: 'تم تحديث الموعد بنجاح'
  });
});

export default router;
