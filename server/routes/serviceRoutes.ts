import { Router, Response } from 'express';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { execute, executeBatch, query, queryOne } from '../db';
import { authenticateToken, AuthenticatedRequest, createAuditLog, createNotification } from '../middleware';

const router = Router();
export const providersRouter = Router();
export const requestsRouter = Router();
export const paymentsRouter = Router();
const priorities = ['Critical', 'High', 'Medium', 'Low'];
const paymentMethods = ['cib', 'edahabia'];
const serviceSelect = `
  SELECT s.id, s.provider_id, s.title, s.description, s.amount_dzd, s.category, s.is_active
  FROM services s
`;
const providerReady = `(
  (u.role_slug = 'psychologist' AND EXISTS (
    SELECT 1 FROM specialist_profiles sp WHERE sp.user_id = u.id AND sp.verification_status = 'approved'
  )) OR
  (u.role_slug = 'treatment_center' AND EXISTS (
    SELECT 1 FROM centers c WHERE c.user_id = u.id AND c.verification_status = 'approved'
  )) OR
  (u.role_slug = 'association' AND EXISTS (
    SELECT 1 FROM associations a WHERE a.user_id = u.id AND a.verification_status = 'approved'
  )) OR u.role_slug = 'lawyer'
)`;

function fail(res: Response, status: number, message: string): void {
  res.status(status).json({ success: false, message });
}

function isProvider(user: AuthenticatedRequest['user']): boolean {
  return !!user && ['psychologist', 'lawyer', 'treatment_center', 'association'].includes(user.role_slug);
}

function isRejectionReasonVisibleToClient(): boolean {
  const setting = queryOne<{ value: string }>(
    'SELECT value FROM system_settings WHERE key = ?',
    ['show_rejection_reason_to_client'],
  );
  return ['true', '1'].includes(String(setting?.value || '').toLowerCase());
}

function shouldMaskRejectionReason(user: NonNullable<AuthenticatedRequest['user']>): boolean {
  return ['patient', 'family'].includes(user.role_slug) && !isRejectionReasonVisibleToClient();
}

function providerAuthorized(providerId: number, user: NonNullable<AuthenticatedRequest['user']>): boolean {
  return user.role_slug === 'admin' || providerId === user.id;
}

function getRequest(id: number): any {
  return queryOne<any>(`
    SELECT r.*, c.number_case, c.created_by, c.patient_id,
      client.first_name || ' ' || client.last_name AS client_name,
      provider.first_name || ' ' || provider.last_name AS provider_name,
      s.title AS service_title,
      r.assigned_staff_id,
      staff.first_name AS assigned_staff_first_name,
      staff.last_name AS assigned_staff_last_name,
      staff.role_slug AS assigned_staff_role_slug,
      (SELECT appointment_date FROM appointments a WHERE a.id = r.appointment_id) AS appointment_date,
      (SELECT start_time FROM appointments a WHERE a.id = r.appointment_id) AS start_time,
      (SELECT end_time FROM appointments a WHERE a.id = r.appointment_id) AS end_time,
      (SELECT rf.status FROM refunds rf JOIN payments p ON p.id = rf.payment_id
        WHERE p.request_id = r.id ORDER BY rf.created_at DESC, rf.id DESC LIMIT 1) AS refund_status
    FROM service_requests r
    JOIN case_files c ON c.id = r.case_file_id
    JOIN users client ON client.id = r.requester_id
    JOIN users provider ON provider.id = r.provider_id
    LEFT JOIN users staff ON staff.id = r.assigned_staff_id
    JOIN services s ON s.id = r.service_id
    WHERE r.id = ?
  `, [id]);
}

function isAssignedStaff(request: any, user: NonNullable<AuthenticatedRequest['user']>): boolean {
  return Number(request.assigned_staff_id) === user.id &&
    !!queryOne('SELECT id FROM provider_staff WHERE provider_id = ? AND staff_user_id = ? AND is_active = 1',
      [request.provider_id, user.id]);
}

function canManageRequest(request: any, user: NonNullable<AuthenticatedRequest['user']>): boolean {
  return providerAuthorized(Number(request.provider_id), user) || isAssignedStaff(request, user);
}

function canAccessRequest(req: any, user: NonNullable<AuthenticatedRequest['user']>): boolean {
  return user.role_slug === 'admin' ||
    req.requester_id === user.id || req.created_by === user.id || req.patient_id === user.id ||
    canManageRequest(req, user);
}

function addHistory(requestId: number, userId: number | null, action: string, from: string | null, to: string | null, details?: string): void {
  execute(
    'INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details) VALUES (?, ?, ?, ?, ?, ?)',
    [requestId, userId, action, from, to, details || null],
  );
}

function notifyTransition(request: any, title: string, message: string): void {
  createNotification(request.requester_id, title, message, 'service_request', `/dashboard/requests/${request.id}`);
  createNotification(request.provider_id, title, message, 'service_request', `/dashboard/requests/${request.id}`);
}

function generateCaseNumber(): string | null {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `SCP-${new Date().getFullYear()}-${randomBytes(12).toString('hex').toUpperCase()}`;
    if (!queryOne('SELECT id FROM case_files WHERE number_case = ?', [candidate])) return candidate;
  }
  return null;
}

providersRouter.get('/', (req, res) => {
  const serviceId = Number(req.query.service_id);
  if (!Number.isInteger(serviceId) || serviceId < 1) {
    fail(res, 400, 'service_id is required');
    return;
  }
  const providers = query(`
    SELECT DISTINCT u.id, u.first_name, u.last_name, u.role_slug, w.name_ar AS wilaya_name
    FROM services s
    JOIN users u ON u.id = s.provider_id
    LEFT JOIN wilayas w ON w.id = u.wilaya_id
    WHERE s.id = ? AND s.is_active = 1 AND u.status = 'active' AND u.is_verified = 1 AND ${providerReady}
    ORDER BY u.first_name, u.last_name
  `, [serviceId]);
  res.json({ success: true, data: providers });
});

function isFacilityManager(user: NonNullable<AuthenticatedRequest['user']>, providerId: number): boolean {
  return providerId === user.id && ['treatment_center', 'association'].includes(user.role_slug) &&
    !!queryOne(`SELECT u.id FROM users u WHERE u.id = ? AND u.role_slug = ? AND u.status = 'active'
      AND u.is_verified = 1 AND u.role_slug IN ('treatment_center','association') AND ${providerReady}`, [user.id, user.role_slug]);
}

providersRouter.get('/:providerId/staff', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const providerId = Number(req.params.providerId);
  if (!Number.isInteger(providerId) || (user.role_slug !== 'admin' && !isFacilityManager(user, providerId))) {
    return fail(res, 403, 'Only the facility/association manager or admin may view its affiliated staff');
  }
  const staff = query(`
    SELECT ps.staff_user_id, u.first_name, u.last_name, u.role_slug, u.email, ps.is_active, ps.created_at
    FROM provider_staff ps JOIN users u ON u.id = ps.staff_user_id
    WHERE ps.provider_id = ? ORDER BY ps.created_at DESC
  `, [providerId]);
  res.json({ success: true, data: staff });
});

providersRouter.post('/:providerId/staff', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const providerId = Number(req.params.providerId);
  const staffId = Number(req.body.staff_user_id);
  if (!Number.isInteger(providerId) || !Number.isInteger(staffId) || staffId < 1) return fail(res, 422, 'Valid staff_user_id is required');
  if (user.role_slug !== 'admin' && !isFacilityManager(user, providerId)) {
    return fail(res, 403, 'Only the facility/association manager may affiliate staff');
  }
  const provider = queryOne<any>(`SELECT u.id, u.role_slug FROM users u
    WHERE u.id = ? AND u.status = 'active' AND u.is_verified = 1 AND ${providerReady}`, [providerId]);
  const staff = queryOne<any>(`
    SELECT u.id, u.role_slug FROM users u
    JOIN specialist_profiles sp ON sp.user_id = u.id
    WHERE u.id = ? AND u.status = 'active' AND u.is_verified = 1
      AND u.role_slug IN ('psychologist','lawyer') AND sp.verification_status = 'approved'
  `, [staffId]);
  if (!provider || !['treatment_center', 'association'].includes(provider.role_slug) || !staff || staffId === providerId) {
    return fail(res, 422, 'Only active, approved psychologists/lawyers may be affiliated with an active facility or association');
  }
  execute(`INSERT INTO provider_staff (provider_id, staff_user_id, is_active) VALUES (?, ?, 1)
    ON CONFLICT (provider_id, staff_user_id) DO UPDATE SET is_active = 1`,
    [providerId, staffId]);
  createNotification(staffId, 'تمت إضافتك إلى فريق مقدم خدمة', 'أصبحت عضواً معتمداً ضمن فريق مقدم الخدمة.', 'provider_staff', '/dashboard/requests');
  createAuditLog(user.id, 'PROVIDER_STAFF_ADD', 'provider_staff', `${providerId}:${staffId}`, 'Affiliated approved specialist with provider', req.ip);
  res.status(201).json({ success: true, data: { provider_id: providerId, staff_user_id: staffId, is_active: 1 } });
});

providersRouter.delete('/:providerId/staff/:staffId', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const providerId = Number(req.params.providerId), staffId = Number(req.params.staffId);
  if (user.role_slug !== 'admin' && !isFacilityManager(user, providerId)) {
    return fail(res, 403, 'Only the facility/association manager may remove affiliated staff');
  }
  const membership = queryOne<any>('SELECT id FROM provider_staff WHERE provider_id = ? AND staff_user_id = ? AND is_active = 1', [providerId, staffId]);
  if (!membership) return fail(res, 404, 'Active provider staff membership not found');
  const assignedCases = query<{ case_file_id: number }>(`SELECT case_file_id FROM service_requests
    WHERE provider_id = ? AND assigned_staff_id = ?`, [providerId, staffId]);
  execute(`UPDATE case_assignments SET status = 'revoked'
    WHERE specialist_id = ? AND status = 'accepted' AND case_file_id IN (
      SELECT case_file_id FROM service_requests WHERE provider_id = ? AND assigned_staff_id = ?
    )`, [staffId, providerId, staffId]);
  execute(`UPDATE case_files SET
    assigned_psychologist_id = CASE WHEN assigned_psychologist_id = ? THEN NULL ELSE assigned_psychologist_id END,
    assigned_lawyer_id = CASE WHEN assigned_lawyer_id = ? THEN NULL ELSE assigned_lawyer_id END
    WHERE id IN (SELECT case_file_id FROM service_requests WHERE provider_id = ? AND assigned_staff_id = ?)`,
    [staffId, staffId, providerId, staffId]);
  assignedCases.forEach(({ case_file_id }) => {
    const conversation = queryOne<any>('SELECT id FROM conversations WHERE case_file_id = ?', [case_file_id]);
    if (conversation) execute('DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [conversation.id, staffId]);
  });
  execute('UPDATE service_requests SET assigned_staff_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE provider_id = ? AND assigned_staff_id = ?',
    [providerId, staffId]);
  execute('UPDATE provider_staff SET is_active = 0 WHERE provider_id = ? AND staff_user_id = ?', [providerId, staffId]);
  createNotification(staffId, 'تم إنهاء ارتباطك بمقدم الخدمة', 'لم تعد عضواً في فريق مقدم الخدمة.', 'provider_staff', '/dashboard/requests');
  createAuditLog(user.id, 'PROVIDER_STAFF_REMOVE', 'provider_staff', `${providerId}:${staffId}`, 'Deactivated provider staff membership', req.ip);
  res.json({ success: true, data: { provider_id: providerId, staff_user_id: staffId, is_active: 0 } });
});

router.get('/', (_req, res) => {
  const services = query(`
    ${serviceSelect}
    JOIN users u ON u.id = s.provider_id
    WHERE s.is_active = 1 AND u.status = 'active' AND u.is_verified = 1 AND ${providerReady}
    ORDER BY s.category, s.title
  `);
  res.json({ success: true, data: services });
});

router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role_slug !== 'admin' && !isProvider(user)) {
    fail(res, 403, 'Only an approved provider or admin may create services');
    return;
  }
  const { title, description, amount_dzd, category, provider_id } = req.body;
  const ownerId = user.role_slug === 'admin' ? Number(provider_id) : user.id;
  const amount = Number(amount_dzd);
  if (!Number.isInteger(ownerId) || ownerId < 1 || !title?.trim() || !description?.trim() ||
      !category?.trim() || !Number.isInteger(amount) || amount < 0) {
    fail(res, 422, 'Valid provider_id, title, description, category and non-negative integer amount_dzd are required');
    return;
  }
  const owner = queryOne<any>(`SELECT id FROM users u WHERE u.id = ? AND u.status = 'active' AND u.is_verified = 1 AND ${providerReady}`, [ownerId]);
  if (!owner) {
    fail(res, 422, 'Service owner is not an approved provider');
    return;
  }
  const result = execute(
    'INSERT INTO services (provider_id, title, description, amount_dzd, category) VALUES (?, ?, ?, ?, ?)',
    [ownerId, title.trim(), description.trim(), amount, category.trim()],
  );
  const service = queryOne(`${serviceSelect} WHERE s.id = ?`, [result.lastInsertRowId]);
  createAuditLog(user.id, 'CREATE_SERVICE', 'services', result.lastInsertRowId, `Service ${title}`, req.ip);
  res.status(201).json({ success: true, data: service });
});

router.put('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const id = Number(req.params.id);
  const existing = queryOne<any>('SELECT * FROM services WHERE id = ?', [id]);
  if (!existing) {
    fail(res, 404, 'Service not found');
    return;
  }
  if (user.role_slug !== 'admin' && (existing.provider_id !== user.id || !isProvider(user))) {
    fail(res, 403, 'You may update only your own services');
    return;
  }
  const title = req.body.title === undefined ? existing.title : String(req.body.title).trim();
  const description = req.body.description === undefined ? existing.description : String(req.body.description).trim();
  const category = req.body.category === undefined ? existing.category : String(req.body.category).trim();
  const amount = req.body.amount_dzd === undefined ? Number(existing.amount_dzd) : Number(req.body.amount_dzd);
  const active = req.body.is_active === undefined ? Number(existing.is_active) : (req.body.is_active === true || req.body.is_active === 1 ? 1 : 0);
  if (!title || !description || !category || !Number.isInteger(amount) || amount < 0 || ![0, 1].includes(active)) {
    fail(res, 422, 'Invalid service fields');
    return;
  }
  execute(`UPDATE services SET title = ?, description = ?, category = ?, amount_dzd = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, description, category, amount, active, id]);
  createAuditLog(user.id, 'UPDATE_SERVICE', 'services', id, 'Service updated', req.ip);
  res.json({ success: true, data: queryOne(`${serviceSelect} WHERE s.id = ?`, [id]) });
});

router.get('/mine', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (!isProvider(user) && user.role_slug !== 'admin') {
    fail(res, 403, 'Provider access required');
    return;
  }
  const services = user.role_slug === 'admin'
    ? query(`${serviceSelect} ORDER BY s.id DESC`)
    : query(`${serviceSelect} WHERE s.provider_id = ? ORDER BY s.id DESC`, [user.id]);
  res.json({ success: true, data: services });
});

requestsRouter.get('/stats', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const scope = user.role_slug === 'admin' ? '' :
    (isProvider(user) ? ' WHERE r.provider_id = ? OR r.assigned_staff_id = ?' :
      ' WHERE r.requester_id = ?');
  const params = user.role_slug === 'admin' ? [] : isProvider(user) ? [user.id, user.id] : [user.id];
  const stats = queryOne<any>(`
    SELECT
      COALESCE(SUM(CASE WHEN r.status IN ('NEW','WAITING_PROVIDER') THEN 1 ELSE 0 END), 0) AS pending,
      COALESCE(SUM(CASE WHEN r.status IN ('ACCEPTED','AWAITING_PAYMENT') THEN 1 ELSE 0 END), 0) AS accepted,
      COALESCE(SUM(CASE WHEN r.status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejected,
      COALESCE(SUM(CASE WHEN r.status = 'IN_PROGRESS' THEN 1 ELSE 0 END), 0) AS in_progress,
      COALESCE(SUM(CASE WHEN r.status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS upcoming,
      COALESCE(SUM(CASE WHEN r.payment_status = 'PAID' THEN 1 ELSE 0 END), 0) AS paid,
      COALESCE(SUM(CASE WHEN r.payment_status = 'PAID' THEN r.amount_dzd ELSE 0 END), 0) AS revenue_dzd
    FROM service_requests r ${scope}
  `, params);
  res.json({ success: true, data: stats });
});

requestsRouter.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (!['patient', 'family'].includes(user.role_slug)) {
    fail(res, 403, 'Only a client may submit a service request');
    return;
  }
  const { service_id, provider_id, addiction_type_id, description, priority } = req.body;
  const serviceId = Number(service_id), providerId = Number(provider_id), addictionId = Number(addiction_type_id);
  if (![serviceId, providerId, addictionId].every(n => Number.isInteger(n) && n > 0) ||
      typeof description !== 'string' || description.trim().length < 15 || !priorities.includes(priority)) {
    fail(res, 422, 'Valid service, provider, addiction type, description (15+ characters), and priority are required');
    return;
  }
  const service = queryOne<any>(`
    SELECT s.* FROM services s JOIN users u ON u.id = s.provider_id
    WHERE s.id = ? AND s.provider_id = ? AND s.is_active = 1 AND u.status = 'active' AND u.is_verified = 1 AND ${providerReady}
  `, [serviceId, providerId]);
  const addiction = queryOne<any>('SELECT id FROM addiction_types WHERE id = ? AND is_active = 1', [addictionId]);
  if (!service || !addiction) {
    fail(res, 422, 'The selected active service/provider or addiction type is unavailable');
    return;
  }
  const numberCase = generateCaseNumber();
  if (!numberCase) return fail(res, 503, 'Unable to generate a unique case number; please retry');
  const targetHours = priority === 'Critical' ? 2 : priority === 'High' ? 24 : priority === 'Medium' ? 72 : 168;
  const created = executeBatch([
    {
      sql: `INSERT INTO case_files (number_case, created_by, patient_id, addiction_type_id, priority, status, description, target_response_hours)
        VALUES (?, ?, ?, ?, ?, 'NEW', ?, ?) RETURNING id`,
      params: [numberCase, user.id, user.id, addictionId, priority, description.trim(), targetHours],
    },
    {
      sql: `INSERT INTO service_requests (case_file_id, requester_id, provider_id, service_id, addiction_type_id, amount_dzd, payment_status, status, priority, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING_PROVIDER', ?, ?) RETURNING id`,
      params: [
        { __batchResult: 0, column: 'id' }, user.id, providerId, serviceId, addictionId,
        service.amount_dzd, Number(service.amount_dzd) === 0 ? 'NOT_REQUIRED' : 'PENDING',
        priority, description.trim(),
      ],
    },
  ]);
  const caseId = created[0].lastInsertRowId;
  const requestId = created[1].lastInsertRowId;
  execute('UPDATE case_files SET priority = ? WHERE id = ?', [priority, caseId]);
  addHistory(requestId, user.id, 'REQUEST_CREATED', null, 'WAITING_PROVIDER');
  execute('INSERT INTO conversations (case_file_id, title) VALUES (?, ?)', [caseId, `محادثة الطلب ${numberCase}`]);
  const conversation = queryOne<any>('SELECT id FROM conversations WHERE case_file_id = ?', [caseId]);
  if (conversation) {
    execute('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', [conversation.id, user.id]);
    execute('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', [conversation.id, providerId]);
  }
  createNotification(providerId, 'لديك طلب خدمة جديد', `طلب جديد رقم ${numberCase} بانتظار المراجعة.`, 'service_request', `/dashboard/requests/${requestId}`);
  createNotification(user.id, 'تم إرسال طلبك', `تم إرسال الطلب رقم ${numberCase} إلى مقدم الخدمة.`, 'service_request', `/dashboard/requests/${requestId}`);
  createAuditLog(user.id, 'CREATE_SERVICE_REQUEST', 'service_requests', requestId, `Case ${numberCase}`, req.ip);
  res.status(201).json({ success: true, data: { request_id: requestId, case_file_id: caseId, number_case: numberCase } });
});

requestsRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const where = user.role_slug === 'admin' ? '' :
    (isProvider(user) ? ` WHERE (r.provider_id = ? OR r.assigned_staff_id = ?)` : ` WHERE (r.requester_id = ? OR c.patient_id = ?)`);
  const params = user.role_slug === 'admin' ? [] : isProvider(user) ? [user.id, user.id] : [user.id, user.id];
  const requests = query(`
    SELECT r.id, r.case_file_id, c.number_case, client.first_name || ' ' || client.last_name AS client_name,
      r.provider_id, provider.first_name || ' ' || provider.last_name AS provider_name, r.service_id,
      s.title AS service_title, r.amount_dzd, r.payment_status, r.status, r.priority, r.description,
      r.created_at, r.rejection_reason,
      (SELECT a.appointment_date FROM appointments a WHERE a.id = r.appointment_id) AS appointment_date,
      (SELECT a.start_time FROM appointments a WHERE a.id = r.appointment_id) AS start_time,
      (SELECT a.end_time FROM appointments a WHERE a.id = r.appointment_id) AS end_time,
      r.assigned_staff_id, staff.first_name AS assigned_staff_first_name,
      staff.last_name AS assigned_staff_last_name, staff.role_slug AS assigned_staff_role_slug,
      (SELECT sr.client_summary FROM service_reports sr WHERE sr.request_id = r.id ORDER BY sr.id DESC LIMIT 1) AS report_summary
    FROM service_requests r JOIN case_files c ON c.id = r.case_file_id
      JOIN users client ON client.id = r.requester_id JOIN users provider ON provider.id = r.provider_id
      JOIN services s ON s.id = r.service_id LEFT JOIN users staff ON staff.id = r.assigned_staff_id ${where}
    ORDER BY CASE r.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END, r.created_at DESC
  `, params);
  const data = shouldMaskRejectionReason(user)
    ? requests.map((request: any) => ({ ...request, rejection_reason: null }))
    : requests;
  res.json({ success: true, data });
});

requestsRouter.get('/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const request = getRequest(Number(req.params.id));
  if (!request) {
    fail(res, 404, 'Request not found');
    return;
  }
  if (!canAccessRequest(request, req.user!)) {
    fail(res, 403, 'You may not view this request');
    return;
  }
  const clinicalView = req.user!.role_slug === 'admin' ||
    (req.user!.role_slug === 'psychologist' && Number(request.provider_id) === req.user!.id) ||
    (req.user!.role_slug === 'psychologist' && isAssignedStaff(request, req.user!));
  const maskRejectionReason = shouldMaskRejectionReason(req.user!);
  const visibleRequest = maskRejectionReason ? { ...request, rejection_reason: null } : request;
  const requestHistory = query<any>('SELECT id, user_id, action, from_status, to_status, details, created_at FROM request_history WHERE request_id = ? ORDER BY id', [request.id]);
  const history = maskRejectionReason
    ? requestHistory.map(entry =>
      String(entry.action).toUpperCase().includes('REJECT') || entry.to_status === 'REJECTED'
        ? { ...entry, details: null }
        : entry)
    : requestHistory;
  const reports = query<any>('SELECT * FROM service_reports WHERE request_id = ? ORDER BY id DESC', [request.id])
    .map(report => clinicalView
      ? report
      : { id: report.id, client_summary: report.client_summary, created_at: report.created_at });
  res.json({ success: true, data: { request: visibleRequest, history, reports } });
});

requestsRouter.post('/:id/cancel', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const request = getRequest(Number(req.params.id));
  if (!request) return fail(res, 404, 'Request not found');
  const isClientOwner = request.requester_id === user.id || request.created_by === user.id || request.patient_id === user.id;
  if (user.role_slug !== 'admin' && !isClientOwner) {
    return fail(res, 403, 'Only the requesting client or an admin may cancel this request');
  }
  const reason = req.body?.reason;
  if (reason !== undefined && (typeof reason !== 'string' || reason.trim().length > 1000)) {
    return fail(res, 422, 'reason must be a string of at most 1000 characters');
  }
  const cancellationReason = typeof reason === 'string' && reason.trim()
    ? reason.trim()
    : 'Service request canceled by client or administrator';
  const cancellableStatuses = ['NEW', 'WAITING_PROVIDER', 'ACCEPTED', 'AWAITING_PAYMENT', 'CONFIRMED'];
  if (!cancellableStatuses.includes(request.status)) {
    return fail(res, 409, 'This request cannot be canceled in its current status');
  }
  const linkedAppointment = request.appointment_id
    ? queryOne<any>('SELECT status FROM appointments WHERE id = ?', [request.appointment_id])
    : null;
  if (linkedAppointment && ['IN_PROGRESS', 'COMPLETED'].includes(linkedAppointment.status)) {
    return fail(res, 409, 'A request with an in-progress or completed appointment cannot be canceled');
  }

  executeBatch([
    {
      sql: `UPDATE appointments SET status = 'CANCELED',
          cancellation_reason = COALESCE(?, cancellation_reason)
        WHERE id = (SELECT appointment_id FROM service_requests WHERE id = ? AND status = ?)
          AND status IN ('PENDING','CONFIRMED')`,
      params: [cancellationReason, request.id, request.status],
    },
    {
      sql: `UPDATE service_requests SET status = 'CANCELED', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = ? AND status IN ('NEW','WAITING_PROVIDER','ACCEPTED','AWAITING_PAYMENT','CONFIRMED')`,
      params: [request.id, request.status],
      expectRowCount: 1,
    },
    {
      sql: `INSERT INTO refunds (payment_id, requested_by, amount_dzd, status, reason)
        SELECT p.id, ?, p.amount_dzd, 'REQUESTED', ?
        FROM payments p
        WHERE p.request_id = ? AND p.status = 'PAID'
          AND NOT EXISTS (SELECT 1 FROM refunds rf WHERE rf.payment_id = p.id)`,
      params: [user.id, cancellationReason, request.id],
    },
    {
      sql: `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details)
        VALUES (?, ?, 'REQUEST_CANCELED', ?, 'CANCELED', ?)`,
      params: [request.id, user.id, request.status, cancellationReason],
    },
    {
      sql: 'DELETE FROM payment_checkout_locks WHERE request_id = ?',
      params: [request.id],
    },
  ]);

  createAuditLog(user.id, 'REQUEST_CANCELED', 'service_requests', request.id, cancellationReason, req.ip);
  const updated = getRequest(request.id);
  if (updated) notifyTransition(updated, 'تم إلغاء طلب الخدمة', 'تم إلغاء طلب الخدمة. إذا كان الدفع قد تم، فحالة الاسترداد مطلوبة للمراجعة ولم يتم تأكيد أي استرداد بعد.');
  res.json({ success: true, data: updated });
});

requestsRouter.post('/:id/assign-staff', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const request = getRequest(Number(req.params.id));
  if (!request) return fail(res, 404, 'Request not found');
  if (user.role_slug !== 'admin' && !isFacilityManager(user, Number(request.provider_id))) {
    return fail(res, 403, 'Only the owning facility/association manager may assign affiliated staff');
  }
  const staffId = Number(req.body.staff_user_id);
  if (!Number.isInteger(staffId) || staffId < 1) return fail(res, 422, 'Valid staff_user_id is required');
  const member = queryOne<any>(`
    SELECT u.id, u.role_slug FROM provider_staff ps
    JOIN users u ON u.id = ps.staff_user_id
    JOIN specialist_profiles sp ON sp.user_id = u.id
    WHERE ps.provider_id = ? AND ps.staff_user_id = ? AND ps.is_active = 1
      AND u.status = 'active' AND u.is_verified = 1
      AND u.role_slug IN ('psychologist','lawyer') AND sp.verification_status = 'approved'
  `, [request.provider_id, staffId]);
  if (!member) return fail(res, 422, 'Assigned staff must be an active, approved member of this provider');
  const previousStaffId = Number(request.assigned_staff_id) || null;
  if (previousStaffId && previousStaffId !== staffId) {
    execute(`UPDATE case_assignments SET status = 'revoked'
      WHERE case_file_id = ? AND specialist_id = ? AND status = 'accepted'`,
      [request.case_file_id, previousStaffId]);
    const previousConversation = queryOne<any>('SELECT id FROM conversations WHERE case_file_id = ?', [request.case_file_id]);
    if (previousConversation) {
      execute('DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        [previousConversation.id, previousStaffId]);
    }
  }
  execute('UPDATE service_requests SET assigned_staff_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [staffId, request.id]);
  if (member.role_slug === 'psychologist') {
    execute(`UPDATE case_files SET assigned_psychologist_id = ?, assigned_lawyer_id = NULL,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [staffId, request.case_file_id]);
  } else {
    execute(`UPDATE case_files SET assigned_lawyer_id = ?, assigned_psychologist_id = NULL,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [staffId, request.case_file_id]);
  }
  execute(`INSERT INTO case_assignments (case_file_id, specialist_id, assigned_by, role_type, status, notes)
    VALUES (?, ?, ?, ?, 'accepted', ?)`,
    [request.case_file_id, staffId, user.id, member.role_slug, `Assigned by provider manager for request ${request.id}`]);
  const conversation = queryOne<any>('SELECT id FROM conversations WHERE case_file_id = ?', [request.case_file_id]);
  if (conversation) {
    const existing = queryOne('SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [conversation.id, staffId]);
    if (!existing) execute('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', [conversation.id, staffId]);
  }
  if (previousStaffId && previousStaffId !== staffId) {
    createNotification(previousStaffId, 'تم تحديث إسناد الطلب', `تم إسناد الطلب رقم ${request.number_case} إلى مختص آخر.`, 'service_request', `/dashboard/requests/${request.id}`);
  }
  createNotification(staffId, 'تم إسناد طلب جديد إليك', `تم إسناد الطلب رقم ${request.number_case} إليك من قبل مقدم الخدمة.`, 'service_request', `/dashboard/requests/${request.id}`);
  createNotification(request.requester_id, 'تم تعيين مختص لطلبك', `تم تعيين مختص لمتابعة الطلب رقم ${request.number_case}.`, 'service_request', `/dashboard/requests/${request.id}`);
  addHistory(request.id, user.id, 'STAFF_ASSIGNED', request.status, request.status, `staff_user_id=${staffId}`);
  createAuditLog(user.id, 'REQUEST_STAFF_ASSIGN', 'service_requests', request.id, `Assigned staff ${staffId}`, req.ip);
  res.json({ success: true, data: getRequest(request.id) });
});

requestsRouter.put('/:id/decision', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const request = getRequest(Number(req.params.id));
  if (!request) return fail(res, 404, 'Request not found');
  if (!canManageRequest(request, user)) return fail(res, 403, 'Only the owning provider, assigned staff, or admin may decide');
  const { decision, reason } = req.body;
  if (!['accept', 'reject'].includes(decision) || (decision === 'reject' && (typeof reason !== 'string' || !reason.trim()))) {
    return fail(res, 422, 'decision must be accept or reject; rejection requires a reason');
  }
  if (!['NEW', 'WAITING_PROVIDER'].includes(request.status)) return fail(res, 409, 'Request already has a decision');
  const next = decision === 'accept' ? (Number(request.amount_dzd) === 0 ? 'ACCEPTED' : 'AWAITING_PAYMENT') : 'REJECTED';
  const paymentStatus = decision === 'accept' ? (Number(request.amount_dzd) === 0 ? 'NOT_REQUIRED' : 'PENDING') : request.payment_status;
  execute(`UPDATE service_requests SET status = ?, payment_status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('NEW','WAITING_PROVIDER')`,
    [next, paymentStatus, decision === 'reject' ? reason.trim() : null, request.id]);
  execute(`UPDATE case_files SET status = ?, assigned_psychologist_id = CASE WHEN ? = 'psychologist' THEN ? ELSE assigned_psychologist_id END,
    assigned_lawyer_id = CASE WHEN ? = 'lawyer' THEN ? ELSE assigned_lawyer_id END,
    treatment_center_id = CASE WHEN ? = 'treatment_center' THEN ? ELSE treatment_center_id END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [decision === 'reject' ? 'REJECTED' : 'ASSIGNED', (queryOne<any>('SELECT role_slug FROM users WHERE id = ?', [request.provider_id]) || {}).role_slug,
      request.provider_id, (queryOne<any>('SELECT role_slug FROM users WHERE id = ?', [request.provider_id]) || {}).role_slug,
      request.provider_id, (queryOne<any>('SELECT role_slug FROM users WHERE id = ?', [request.provider_id]) || {}).role_slug, request.provider_id, request.case_file_id]);
  addHistory(request.id, user.id, decision === 'accept' ? 'ACCEPTED' : 'REJECTED', request.status, next, decision === 'reject' ? reason.trim() : null);
  const updated = getRequest(request.id);
  const rejectionMessage = isRejectionReasonVisibleToClient()
    ? `سبب الرفض: ${reason.trim()}`
    : 'تعذر قبول طلبك. يرجى التواصل مع مقدم الخدمة لمزيد من المعلومات.';
  notifyTransition(updated, decision === 'accept' ? 'تم قبول طلبك' : 'تم رفض طلبك',
    decision === 'accept' ? (Number(request.amount_dzd) > 0 ? 'طلبك مقبول، يرجى إتمام الدفع.' : 'تم قبول طلبك، وسيتم تنسيق الخدمة.') : rejectionMessage);
  createAuditLog(user.id, `REQUEST_${decision.toUpperCase()}`, 'service_requests', request.id, reason || '', req.ip);
  res.json({ success: true, data: updated });
});

requestsRouter.put('/:id/priority', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const request = getRequest(Number(req.params.id));
  if (!request) return fail(res, 404, 'Request not found');
  if (!canManageRequest(request, user)) return fail(res, 403, 'Only the owning provider, assigned staff, or admin may change priority');
  if (!priorities.includes(req.body.priority)) return fail(res, 422, 'Invalid priority');
  execute('UPDATE service_requests SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.body.priority, request.id]);
  execute('UPDATE case_files SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.body.priority, request.case_file_id]);
  addHistory(request.id, user.id, 'PRIORITY_CHANGED', request.status, request.status, req.body.priority);
  notifyTransition(request, 'تم تحديث أولوية الطلب', `الأولوية الجديدة: ${req.body.priority}`);
  createAuditLog(user.id, 'REQUEST_PRIORITY', 'service_requests', request.id, req.body.priority, req.ip);
  res.json({ success: true, data: getRequest(request.id) });
});

requestsRouter.post('/:id/appointment', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const request = getRequest(Number(req.params.id));
  if (!request) return fail(res, 404, 'Request not found');
  if (!canManageRequest(request, user)) return fail(res, 403, 'Only the owning provider, assigned staff, or admin may schedule');
  const { appointment_date, start_time, end_time } = req.body;
  if (!['ACCEPTED', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED'].includes(request.status) ||
      typeof appointment_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date) ||
      typeof start_time !== 'string' || typeof end_time !== 'string' || start_time >= end_time) {
    return fail(res, 422, 'A valid date/time and accepted request are required');
  }
  if (request.appointment_id) return fail(res, 409, 'Appointment already exists');
  const conflict = queryOne<any>(`
    SELECT id FROM appointments WHERE specialist_id = ? AND appointment_date = ? AND status IN ('CONFIRMED','PENDING')
      AND start_time < ? AND end_time > ? LIMIT 1
  `, [request.assigned_staff_id || request.provider_id, appointment_date, end_time, start_time]);
  if (conflict) return fail(res, 409, 'Provider is unavailable for this time');
  const appointment = execute(`
    INSERT INTO appointments (case_file_id, created_by, specialist_id, appointment_date, start_time, end_time, type, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'service', ?, ?)
  `, [request.case_file_id, request.requester_id, request.assigned_staff_id || request.provider_id, appointment_date, start_time, end_time,
    request.payment_status === 'PAID' || Number(request.amount_dzd) === 0 ? 'CONFIRMED' : 'PENDING', 'Service request appointment']);
  execute('UPDATE service_requests SET appointment_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND appointment_id IS NULL',
    [appointment.lastInsertRowId, request.payment_status === 'PAID' || Number(request.amount_dzd) === 0 ? 'CONFIRMED' : 'AWAITING_PAYMENT', request.id]);
  addHistory(request.id, user.id, 'APPOINTMENT_SCHEDULED', request.status, request.status, `${appointment_date} ${start_time}-${end_time}`);
  const updated = getRequest(request.id);
  notifyTransition(updated, 'تم تحديد موعد', `الموعد ${appointment_date} من ${start_time} إلى ${end_time}`);
  createAuditLog(user.id, 'REQUEST_APPOINTMENT', 'service_requests', request.id, appointment_date, req.ip);
  res.status(201).json({ success: true, data: { appointment_id: appointment.lastInsertRowId, status: updated.status } });
});

requestsRouter.put('/:id/status', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const request = getRequest(Number(req.params.id));
  if (!request) return fail(res, 404, 'Request not found');
  if (!canManageRequest(request, user)) return fail(res, 403, 'Only the owning provider, assigned staff, or admin may update status');
  const status = req.body.status;
  if (!['IN_PROGRESS', 'COMPLETED'].includes(status) ||
      (status === 'IN_PROGRESS' && request.status !== 'CONFIRMED') ||
      (status === 'COMPLETED' && request.status !== 'IN_PROGRESS')) return fail(res, 409, 'Invalid request status transition');
  if (status === 'COMPLETED' && !queryOne('SELECT id FROM service_reports WHERE request_id = ? AND final_evaluation IS NOT NULL AND length(trim(final_evaluation)) > 0', [request.id])) {
    return fail(res, 422, 'A final evaluation report is required before completion');
  }
  execute('UPDATE service_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, request.id]);
  execute('UPDATE case_files SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, request.case_file_id]);
  addHistory(request.id, user.id, status, request.status, status);
  const updated = getRequest(request.id);
  notifyTransition(updated, status === 'COMPLETED' ? 'اكتملت الخدمة' : 'بدأت الخدمة', `حالة الطلب: ${status}`);
  createAuditLog(user.id, 'REQUEST_STATUS', 'service_requests', request.id, status, req.ip);
  res.json({ success: true, data: updated });
});

requestsRouter.post('/:id/report', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const request = getRequest(Number(req.params.id));
  if (!request) return fail(res, 404, 'Request not found');
  if (!canManageRequest(request, user)) return fail(res, 403, 'Only the owning provider, assigned staff, or admin may write reports');
  const fields = ['assessment', 'professional_notes', 'recommendations', 'treatment_plan', 'next_appointment', 'client_summary', 'final_evaluation'];
  if (fields.some(field => req.body[field] !== undefined && req.body[field] !== null && typeof req.body[field] !== 'string')) {
    return fail(res, 422, 'Report fields must be text');
  }
  const current = queryOne<any>('SELECT * FROM service_reports WHERE request_id = ? ORDER BY id DESC LIMIT 1', [request.id]);
  const values = fields.map(field => req.body[field] === undefined ? (current?.[field] || null) : req.body[field]);
  if (current) {
    execute(`UPDATE service_reports SET assessment = ?, professional_notes = ?, recommendations = ?, treatment_plan = ?, next_appointment = ?, client_summary = ?, final_evaluation = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, current.id]);
  } else {
    execute(`INSERT INTO service_reports (request_id, provider_id, assessment, professional_notes, recommendations, treatment_plan, next_appointment, client_summary, final_evaluation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [request.id, request.provider_id, ...values]);
  }
  addHistory(request.id, user.id, 'REPORT_UPDATED', request.status, request.status);
  createAuditLog(user.id, 'REQUEST_REPORT', 'service_reports', request.id, 'Service report saved', req.ip);
  res.status(current ? 200 : 201).json({ success: true, data: { request_id: request.id } });
});

function paymentScope(user: NonNullable<AuthenticatedRequest['user']>, alias = 'p'): { sql: string; params: any[] } {
  if (user.role_slug === 'admin') return { sql: '', params: [] };
  if (isProvider(user)) return {
    sql: ` AND (${alias}.provider_id = ? OR EXISTS (SELECT 1 FROM service_requests sr WHERE sr.id = ${alias}.request_id AND sr.assigned_staff_id = ?))`,
    params: [user.id, user.id],
  };
  return { sql: ` AND ${alias}.user_id = ?`, params: [user.id] };
}

paymentsRouter.get('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const scope = paymentScope(user);
  let sql = `SELECT p.*, r.service_id, s.title AS service_title, c.number_case,
      (SELECT rf.status FROM refunds rf WHERE rf.payment_id = p.id ORDER BY rf.created_at DESC, rf.id DESC LIMIT 1) AS refund_status
    FROM payments p
    JOIN service_requests r ON r.id = p.request_id JOIN services s ON s.id = r.service_id
    JOIN case_files c ON c.id = r.case_file_id WHERE 1=1${scope.sql}`;
  const params = [...scope.params];
  if (req.query.request_id !== undefined) {
    const requestId = Number(req.query.request_id);
    if (!Number.isInteger(requestId) || requestId < 1) return fail(res, 400, 'Invalid request_id');
    sql += ' AND p.request_id = ?';
    params.push(requestId);
  }
  res.json({ success: true, data: query(`${sql} ORDER BY p.created_at DESC`, params) });
});

paymentsRouter.get('/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const scope = paymentScope(req.user!);
  const payment = queryOne<any>(`
    SELECT p.*, r.service_id, s.title AS service_title, c.number_case,
      (SELECT rf.status FROM refunds rf WHERE rf.payment_id = p.id ORDER BY rf.created_at DESC, rf.id DESC LIMIT 1) AS refund_status
    FROM payments p
    JOIN service_requests r ON r.id = p.request_id JOIN services s ON s.id = r.service_id
    JOIN case_files c ON c.id = r.case_file_id WHERE p.id = ?${scope.sql}
  `, [Number(req.params.id), ...scope.params]);
  if (!payment) return fail(res, 404, 'Payment not found');
  res.json({ success: true, data: payment });
});

paymentsRouter.post('/checkout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const requestId = Number(req.body.request_id);
  const method = req.body.payment_method;
  if (!Number.isInteger(requestId) || requestId < 1 || !paymentMethods.includes(method)) return fail(res, 422, 'Valid request_id and payment_method (cib|edahabia) are required');
  const request = getRequest(requestId);
  if (!request) return fail(res, 404, 'Request not found');
  if (request.requester_id !== user.id && request.created_by !== user.id && user.role_slug !== 'admin') return fail(res, 403, 'Only the requesting client may pay');
  if (request.status !== 'AWAITING_PAYMENT' || request.payment_status === 'PAID') return fail(res, 409, 'Request is not awaiting payment');
  if (Number(request.amount_dzd) <= 0) return fail(res, 422, 'Payment is not required for a free service');
  if (!process.env.CHARGILY_SECRET_KEY || !['test', 'live'].includes(process.env.CHARGILY_MODE || '') ||
      !process.env.PUBLIC_BACKEND_URL || !process.env.FRONTEND_URL) {
    return fail(res, 503, 'Payment gateway is not configured');
  }
  let frontendRoot: URL;
  let webhookEndpoint: string;
  try {
    frontendRoot = new URL(process.env.FRONTEND_URL.split(',')[0].trim());
    const backendRoot = new URL(process.env.PUBLIC_BACKEND_URL);
    if (!['http:', 'https:'].includes(frontendRoot.protocol) || !['http:', 'https:'].includes(backendRoot.protocol) ||
        frontendRoot.username || frontendRoot.password || backendRoot.username || backendRoot.password) {
      throw new Error('Invalid configured URL');
    }
    frontendRoot.pathname = '/';
    frontendRoot.search = '';
    frontendRoot.hash = '';
    webhookEndpoint = new URL('/api/v1/payments/webhook', backendRoot.origin).toString();
  } catch {
    return fail(res, 503, 'FRONTEND_URL or PUBLIC_BACKEND_URL is invalid');
  }
  const existing = queryOne<any>(`SELECT id, checkout_url FROM payments WHERE request_id = ? AND user_id = ? AND status IN ('PROCESSING','PENDING') ORDER BY id DESC LIMIT 1`,
    [request.id, request.requester_id]);
  if (existing?.checkout_url) {
    res.json({ success: true, data: { checkout_url: existing.checkout_url, payment_id: existing.id } });
    return;
  }
  if (existing) return fail(res, 409, 'A payment checkout for this request is already being created');
  const lockToken = randomBytes(24).toString('hex');
  executeBatch([{
    sql: `INSERT INTO payment_checkout_locks (request_id, lock_token) VALUES (?, ?)
      ON CONFLICT (request_id) DO NOTHING`,
    params: [request.id, lockToken],
  }]);
  const checkoutLock = queryOne<any>('SELECT lock_token, payment_id FROM payment_checkout_locks WHERE request_id = ?', [request.id]);
  if (!checkoutLock || checkoutLock.lock_token !== lockToken) {
    const activePayment = checkoutLock?.payment_id
      ? queryOne<any>('SELECT id, checkout_url FROM payments WHERE id = ? AND status IN (\'PROCESSING\',\'PENDING\')', [checkoutLock.payment_id])
      : null;
    if (activePayment?.checkout_url) {
      res.json({ success: true, data: { checkout_url: activePayment.checkout_url, payment_id: activePayment.id } });
      return;
    }
    return fail(res, 409, 'A payment checkout for this request is already being created');
  }
  const paymentInsert = execute(`INSERT INTO payments (request_id, user_id, provider_id, amount_dzd, currency, payment_method, status)
    VALUES (?, ?, ?, ?, 'dzd', ?, 'PROCESSING')`,
    [request.id, request.requester_id, request.provider_id, request.amount_dzd, method]);
  const paymentId = paymentInsert.lastInsertRowId;
  execute('UPDATE payment_checkout_locks SET payment_id = ? WHERE request_id = ? AND lock_token = ?', [paymentId, request.id, lockToken]);
  execute(`INSERT INTO payment_transactions (payment_id, gateway, amount_dzd, currency, status)
    VALUES (?, 'chargily', ?, 'dzd', 'PROCESSING')`, [paymentId, request.amount_dzd]);
  execute(`UPDATE service_requests SET payment_status = 'PROCESSING' WHERE id = ? AND status = 'AWAITING_PAYMENT'`, [request.id]);
  try {
    const returnUrl = new URL(frontendRoot.toString());
    returnUrl.searchParams.set('payment_id', String(paymentId));
    returnUrl.searchParams.set('request_id', String(request.id));
    const base = process.env.CHARGILY_MODE === 'live' ? 'https://pay.chargily.net/api/v2' : 'https://pay.chargily.net/test/api/v2';
    const response = await fetch(`${base}/checkouts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CHARGILY_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(request.amount_dzd), currency: 'dzd', payment_method: method,
        success_url: returnUrl.toString(),
        failure_url: returnUrl.toString(),
        webhook_endpoint: webhookEndpoint,
        metadata: { payment_id: paymentId, request_id: request.id },
      }),
    });
    const checkout = await response.json() as any;
    if (!response.ok || !checkout.id || !checkout.checkout_url) throw new Error('Chargily did not return a valid checkout');
    execute(`UPDATE payments SET gateway_checkout_id = ?, checkout_url = ?, transaction_id = ? WHERE id = ?`,
      [String(checkout.id), String(checkout.checkout_url), String(checkout.id), paymentId]);
    execute(`UPDATE payment_transactions SET gateway_checkout_id = ? WHERE payment_id = ?`, [String(checkout.id), paymentId]);
    const currentRequest = queryOne<any>('SELECT status FROM service_requests WHERE id = ?', [request.id]);
    if (!currentRequest || currentRequest.status !== 'AWAITING_PAYMENT') {
      execute('DELETE FROM payment_checkout_locks WHERE request_id = ? AND lock_token = ?', [request.id, lockToken]);
      return fail(res, 409, 'The request was canceled while checkout was being created; the payment link was not issued');
    }
    addHistory(request.id, user.id, 'CHECKOUT_CREATED', request.status, request.status, `payment=${paymentId}`);
    createAuditLog(user.id, 'PAYMENT_CHECKOUT', 'payments', paymentId, `Chargily ${method} checkout`, req.ip);
    res.status(201).json({ success: true, data: { checkout_url: checkout.checkout_url, payment_id: paymentId } });
  } catch (error) {
    execute(`UPDATE payments SET status = 'FAILED' WHERE id = ? AND status = 'PROCESSING'`, [paymentId]);
    execute(`UPDATE payment_transactions SET status = 'FAILED' WHERE payment_id = ? AND status = 'PROCESSING'`, [paymentId]);
    execute(`UPDATE service_requests SET payment_status = 'FAILED' WHERE id = ? AND payment_status = 'PROCESSING'`, [request.id]);
    execute('DELETE FROM payment_checkout_locks WHERE request_id = ? AND lock_token = ?', [request.id, lockToken]);
    fail(res, 502, error instanceof Error ? `Payment provider error: ${error.message}` : 'Payment provider error');
  }
});

paymentsRouter.post('/webhook', (req: AuthenticatedRequest, res) => {
  const secret = process.env.CHARGILY_SECRET_KEY;
  const signature = req.header('signature') || req.header('Signature') || '';
  const raw = (req as any).rawBody as Buffer | undefined;
  if (!secret || !raw || !signature || !/^[a-f0-9]{64}$/i.test(signature)) return fail(res, 401, 'Invalid webhook signature');
  const expected = createHmac('sha256', secret).update(raw).digest();
  const received = Buffer.from(signature, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(expected, received)) return fail(res, 401, 'Invalid webhook signature');
  let event: any;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return fail(res, 400, 'Invalid webhook JSON'); }
  if (!['checkout.paid', 'checkout.failed', 'checkout.canceled'].includes(event.type)) {
    res.json({ success: true, data: { received: true, ignored: true } });
    return;
  }
  const checkout = event.data || event.checkout;
  if (!checkout?.id) return fail(res, 400, 'Checkout ID missing');
  const payment = queryOne<any>('SELECT * FROM payments WHERE gateway_checkout_id = ?', [String(checkout.id)]);
  if (!payment) return fail(res, 404, 'Unknown checkout');
  if (Number(checkout.amount) !== Number(payment.amount_dzd) || String(checkout.currency).toLowerCase() !== 'dzd') {
    return fail(res, 400, 'Checkout amount or currency mismatch');
  }
  const eventId = String(event.id || `${event.type}:${checkout.id}`);
  const eventPreviouslyStored = !!queryOne('SELECT id FROM payment_transactions WHERE event_id = ?', [eventId]);
  const requestBefore = getRequest(Number(payment.request_id));
  const appointmentBefore = requestBefore?.appointment_id
    ? queryOne<any>('SELECT status FROM appointments WHERE id = ?', [requestBefore.appointment_id])
    : null;
  const paid = event.type === 'checkout.paid';
  const incomingStatus = paid ? 'PAID' : event.type === 'checkout.failed' ? 'FAILED' : 'CANCELED';
  const transactionId = checkout.transaction_id || checkout.id;
  const reconciliationNeeded = !requestBefore ||
    requestBefore.payment_status !== payment.status ||
    (payment.status === 'PAID' && requestBefore.appointment_id && appointmentBefore?.status !== 'CONFIRMED');
  const result = executeBatch([
    {
      sql: `UPDATE payments SET
          status = CASE WHEN status IN ('PROCESSING','PENDING') THEN ? ELSE status END,
          transaction_id = CASE WHEN status IN ('PROCESSING','PENDING') THEN ? ELSE transaction_id END,
          paid_at = CASE WHEN status IN ('PROCESSING','PENDING') AND ? = 'PAID' THEN COALESCE(paid_at, CURRENT_TIMESTAMP) ELSE paid_at END
        WHERE id = ?`,
      params: [incomingStatus, String(transactionId), incomingStatus, payment.id],
    },
    {
      sql: `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details)
        SELECT r.id, NULL, 'PAYMENT_' || p.status, r.status,
          CASE WHEN r.status IN ('CANCELED','REJECTED','COMPLETED','IN_PROGRESS') THEN r.status
            WHEN r.appointment_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM appointments a WHERE a.id = r.appointment_id AND a.status = 'CANCELED'
            ) THEN 'CANCELED'
            WHEN p.status = 'PAID' AND r.appointment_id IS NOT NULL THEN 'CONFIRMED'
            WHEN p.status = 'PAID' THEN 'ACCEPTED'
            WHEN p.status IN ('FAILED','CANCELED') THEN 'AWAITING_PAYMENT'
            ELSE r.status END,
          ?
        FROM payments p JOIN service_requests r ON r.id = p.request_id
        WHERE p.id = ? AND NOT EXISTS (
          SELECT 1 FROM payment_transactions pt WHERE pt.event_id = ?
        )`,
      params: [`payment=${payment.id}; event=${eventId}`, payment.id, eventId],
    },
    {
      sql: `INSERT INTO payment_transactions
          (payment_id, gateway, gateway_transaction_id, gateway_checkout_id, amount_dzd, currency, status, event_id, payload)
        SELECT p.id, 'chargily', ?, ?, p.amount_dzd, p.currency, p.status, ?, ?
        FROM payments p WHERE p.id = ?
        ON CONFLICT (event_id) DO NOTHING`,
      params: [String(transactionId), String(checkout.id), eventId, raw.toString('utf8'), payment.id],
    },
    {
      sql: `UPDATE appointments SET status = 'CONFIRMED'
        WHERE id = (
          SELECT r.appointment_id FROM service_requests r JOIN payments p ON p.request_id = r.id
          WHERE p.id = ? AND p.status = 'PAID'
            AND p.id = (SELECT MAX(p2.id) FROM payments p2 WHERE p2.request_id = r.id)
        ) AND status = 'PENDING'`,
      params: [payment.id],
    },
    {
      sql: `UPDATE service_requests SET
          payment_status = (SELECT p.status FROM payments p WHERE p.id = ?),
          status = CASE
            WHEN (SELECT p.status FROM payments p WHERE p.id = ?) = 'PAID'
              AND appointment_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM appointments a WHERE a.id = appointment_id AND a.status = 'CANCELED'
              ) AND status NOT IN ('REJECTED','COMPLETED','IN_PROGRESS','CANCELED') THEN 'CANCELED'
            WHEN (SELECT p.status FROM payments p WHERE p.id = ?) = 'PAID'
              AND status IN ('AWAITING_PAYMENT','ACCEPTED','PAID')
              THEN CASE WHEN appointment_id IS NOT NULL THEN 'CONFIRMED' ELSE 'ACCEPTED' END
            WHEN (SELECT p.status FROM payments p WHERE p.id = ?) IN ('FAILED','CANCELED')
              AND status NOT IN ('REJECTED','COMPLETED','IN_PROGRESS')
              THEN 'AWAITING_PAYMENT'
            ELSE status END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT p.request_id FROM payments p WHERE p.id = ?)
          AND ? = (SELECT MAX(p2.id) FROM payments p2 WHERE p2.request_id = service_requests.id)`,
      params: [payment.id, payment.id, payment.id, payment.id, payment.id, payment.id],
    },
    {
      sql: `INSERT INTO refunds (payment_id, requested_by, amount_dzd, status, reason)
        SELECT p.id, r.requester_id, p.amount_dzd, 'REQUESTED', 'Payment arrived after appointment cancellation; manual refund review required'
        FROM payments p JOIN service_requests r ON r.id = p.request_id
        WHERE p.id = ? AND p.status = 'PAID' AND r.status = 'CANCELED'
          AND NOT EXISTS (SELECT 1 FROM refunds rf WHERE rf.payment_id = p.id)`,
      params: [payment.id],
    },
    {
      sql: 'DELETE FROM payment_checkout_locks WHERE request_id = ? AND payment_id = ?',
      params: [payment.request_id, payment.id],
    },
    {
      sql: `SELECT p.status AS payment_status, r.status AS request_status, r.appointment_id,
          a.status AS appointment_status, r.requester_id, r.provider_id,
          (SELECT rf.status FROM refunds rf WHERE rf.payment_id = p.id ORDER BY rf.id DESC LIMIT 1) AS refund_status
        FROM payments p JOIN service_requests r ON r.id = p.request_id
        LEFT JOIN appointments a ON a.id = r.appointment_id WHERE p.id = ?`,
      params: [payment.id],
    },
  ]);
  const finalized = result[7]?.rows?.[0];
  if (!finalized) return fail(res, 500, 'Webhook transaction did not produce a final payment state');
  const shouldNotify = !eventPreviouslyStored || reconciliationNeeded;
  if (shouldNotify) {
    const updated = getRequest(Number(payment.request_id));
    if (updated) {
      const hasPaid = finalized.payment_status === 'PAID';
      const canceledAfterPayment = hasPaid && finalized.request_status === 'CANCELED';
      notifyTransition(updated,
        canceledAfterPayment ? 'تم استلام الدفع والطلب ملغى' : hasPaid ? 'تم الدفع وتأكيد الموعد' : 'تعذر إتمام الدفع',
        canceledAfterPayment
          ? 'تم تسجيل العملية للمراجعة. حالة الاسترداد: مطلوب مراجعة، ولم يتم تأكيد الموعد.'
          : hasPaid ? 'تمت عملية الدفع بنجاح وتم تأكيد موعدك.' : 'لم يتم تحصيل المبلغ، ويمكنك المحاولة مجددًا.');
    }
  }
  createAuditLog(null, `PAYMENT_${finalized.payment_status}`, 'payments', payment.id, `Chargily checkout ${checkout.id}`, req.ip);
  res.json({ success: true, data: { received: true, status: finalized.payment_status, replay: eventPreviouslyStored } });
});

export default router;