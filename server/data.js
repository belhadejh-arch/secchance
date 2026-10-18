import { pool } from './db.js';
import { decryptValue, safeUser } from './security.js';

const PROFESSIONAL_ROLES = [
  'psychologist',
  'doctor',
  'lawyer',
  'legal_advisor',
  'clinic',
  'hospital',
  'association',
  'treatment_center',
];

function dateText(value) {
  if (!value) return '';
  return value instanceof Date ? value.toISOString() : String(value);
}

function displayName(first, last) {
  return [first, last].filter(Boolean).join(' ').trim();
}

export function mapService(row) {
  return {
    id: Number(row.id),
    title: row.title,
    category: row.category,
    description: row.description,
    amountDzd: Number(row.amount_dzd),
    providerId: Number(row.provider_id),
    providerName: displayName(row.provider_first_name, row.provider_last_name),
  };
}

export function mapRequest(row) {
  return {
    id: Number(row.id),
    caseNumber: row.case_number,
    clientId: Number(row.requester_id),
    clientName: displayName(row.client_first_name, row.client_last_name),
    providerId: Number(row.provider_id),
    providerName: displayName(row.provider_first_name, row.provider_last_name),
    serviceId: Number(row.service_id),
    serviceTitle: row.service_title,
    category: row.category,
    amountDzd: Number(row.amount_dzd),
    priority: row.priority,
    status: row.status,
    rejectionReason: row.rejection_reason || null,
    paymentStatus: row.payment_status,
    wilayaName: row.wilaya_name || '',
    description: decryptValue(row.description || ''),
    caseType: row.case_type || undefined,
    attachedDocuments: [],
    createdAt: dateText(row.created_at),
    appointmentDate: row.appointment_date || null,
    appointmentTime: row.appointment_time || null,
    durationMinutes: row.duration_minutes ? Number(row.duration_minutes) : undefined,
    paymentMethod: row.payment_method || undefined,
    appointmentHoldExpiresAt: row.appointment_hold_expires_at || undefined,
    serviceRating: row.service_rating ? Number(row.service_rating) : undefined,
  };
}

function requestScope(user) {
  if (user.role_slug === 'admin') return { sql: '', params: [] };
  return {
    sql: 'WHERE (sr.requester_id = $1 OR sr.provider_id = $1 OR sr.assigned_staff_id = $1)',
    params: [user.id],
  };
}

export async function loadRequests(user) {
  const scope = requestScope(user);
  const result = await pool.query(
    `SELECT sr.id, sr.requester_id, sr.provider_id, sr.service_id, sr.amount_dzd,
            sr.payment_status, sr.status, sr.priority, sr.rejection_reason, sr.created_at,
            cf.number_case AS case_number, cf.description,
            cu.first_name AS client_first_name, cu.last_name AS client_last_name,
            pu.first_name AS provider_first_name, pu.last_name AS provider_last_name,
            s.title AS service_title, s.category,
            w.name_ar AS wilaya_name,
            ap.appointment_date, ap.start_time AS appointment_time,
            ap.status AS appointment_status, ap.id AS appointment_id,
            CASE WHEN ap.start_time IS NOT NULL AND ap.end_time IS NOT NULL THEN
              EXTRACT(EPOCH FROM (ap.end_time::time - ap.start_time::time)) / 60
            ELSE NULL END AS duration_minutes,
            (SELECT p.payment_method FROM payments p WHERE p.request_id = sr.id
             ORDER BY p.created_at DESC LIMIT 1) AS payment_method,
            (SELECT p.status FROM payments p WHERE p.request_id = sr.id
             ORDER BY p.created_at DESC LIMIT 1) AS latest_payment_status,
            NULL::text AS case_type,
            NULL::text AS appointment_hold_expires_at,
            (SELECT r.rating FROM ratings r WHERE r.case_file_id = cf.id AND r.user_id = sr.requester_id
             LIMIT 1) AS service_rating
       FROM service_requests sr
       JOIN case_files cf ON cf.id = sr.case_file_id
       JOIN users cu ON cu.id = sr.requester_id
       JOIN users pu ON pu.id = sr.provider_id
       JOIN services s ON s.id = sr.service_id
       LEFT JOIN wilayas w ON w.id = cu.wilaya_id
       LEFT JOIN appointments ap ON ap.id = sr.appointment_id
       ${scope.sql}
       ORDER BY sr.created_at DESC NULLS LAST`,
    scope.params
  );
  return result.rows.map(mapRequest);
}

export async function loadBootstrap(user) {
  const isAdmin = user.role_slug === 'admin';
  const requests = await loadRequests(user);
  const requestIds = requests.map((request) => request.id);

  const providersResult = await pool.query(
    `SELECT u.*, w.name_ar AS wilaya_name, sp.specialty, sp.license_number,
            sp.years_of_experience, sp.bio, sp.availability_schedule,
            COALESCE(sp.verification_status, c.verification_status, a.verification_status) AS verification_status
       FROM users u
       LEFT JOIN wilayas w ON w.id = u.wilaya_id
       LEFT JOIN specialist_profiles sp ON sp.user_id = u.id
       LEFT JOIN centers c ON c.user_id = u.id
       LEFT JOIN associations a ON a.user_id = u.id
      WHERE u.status = 'active'
        AND COALESCE(u.is_verified, 0) = 1
        AND u.role_slug = ANY($1::text[])
        AND COALESCE(sp.verification_status, c.verification_status, a.verification_status, 'approved') = 'approved'
      ORDER BY u.first_name, u.last_name`,
    [PROFESSIONAL_ROLES]
  );

  let users;
  if (isAdmin) {
    const result = await pool.query(
      `SELECT u.*, w.name_ar AS wilaya_name, sp.specialty, sp.license_number,
              sp.years_of_experience, sp.bio, sp.availability_schedule,
              c.name AS organization_name, c.address,
              COALESCE(sp.verification_status, c.verification_status, a.verification_status) AS verification_status
         FROM users u
         LEFT JOIN wilayas w ON w.id = u.wilaya_id
         LEFT JOIN specialist_profiles sp ON sp.user_id = u.id
         LEFT JOIN centers c ON c.user_id = u.id
         LEFT JOIN associations a ON a.user_id = u.id
        ORDER BY u.created_at DESC NULLS LAST`
    );
    users = result.rows.map((row) => safeUser(row));
  } else {
    const ownResult = await pool.query(
      `SELECT u.*, w.name_ar AS wilaya_name, sp.specialty, sp.license_number,
              sp.years_of_experience, sp.bio, sp.availability_schedule,
              c.name AS organization_name, c.address,
              COALESCE(sp.verification_status, c.verification_status, a.verification_status) AS verification_status
         FROM users u
         LEFT JOIN wilayas w ON w.id = u.wilaya_id
         LEFT JOIN specialist_profiles sp ON sp.user_id = u.id
         LEFT JOIN centers c ON c.user_id = u.id
         LEFT JOIN associations a ON a.user_id = u.id
        WHERE u.id = $1`,
      [user.id]
    );
    const seen = new Set();
    users = [...ownResult.rows, ...providersResult.rows]
      .filter((row) => {
        if (seen.has(Number(row.id))) return false;
        seen.add(Number(row.id));
        return true;
      })
      .map((row) => safeUser(row, { publicProfile: Number(row.id) !== Number(user.id) }));
  }

  const servicesResult = await pool.query(
    `SELECT s.*, u.first_name AS provider_first_name, u.last_name AS provider_last_name
       FROM services s
       JOIN users u ON u.id = s.provider_id
       LEFT JOIN specialist_profiles sp ON sp.user_id = u.id
       LEFT JOIN centers c ON c.user_id = u.id
       LEFT JOIN associations a ON a.user_id = u.id
      WHERE s.is_active = 1 AND u.status = 'active' AND COALESCE(u.is_verified, 0) = 1
        AND COALESCE(sp.verification_status, c.verification_status, a.verification_status, 'approved') = 'approved'
      ORDER BY s.category, s.title`
  );
  const services = servicesResult.rows.map(mapService);

  const appointmentsResult = await pool.query(
    `SELECT a.id, a.case_file_id, a.created_by, a.specialist_id, a.appointment_date,
            a.start_time, a.type, a.status, cf.number_case AS case_number,
            cu.id AS client_id, cu.first_name AS client_first_name, cu.last_name AS client_last_name,
            su.first_name AS specialist_first_name, su.last_name AS specialist_last_name,
            sp.specialty
       FROM appointments a
       JOIN case_files cf ON cf.id = a.case_file_id
       JOIN service_requests sr ON sr.case_file_id = cf.id
       JOIN users cu ON cu.id = sr.requester_id
       JOIN users su ON su.id = a.specialist_id
       LEFT JOIN specialist_profiles sp ON sp.user_id = a.specialist_id
      WHERE ($1::boolean OR sr.requester_id = $2 OR sr.provider_id = $2 OR sr.assigned_staff_id = $2)
      ORDER BY a.appointment_date, a.start_time`,
    [isAdmin, user.id]
  );
  const appointments = appointmentsResult.rows.map((row) => ({
    id: Number(row.id),
    caseNumber: row.case_number,
    clientId: Number(row.client_id),
    clientName: displayName(row.client_first_name, row.client_last_name),
    specialistId: Number(row.specialist_id),
    specialistName: displayName(row.specialist_first_name, row.specialist_last_name),
    specialty: row.specialty || '',
    date: row.appointment_date,
    time: row.start_time,
    type: row.type,
    status: row.status,
  }));

  const reportResult = await pool.query(
    `SELECT r.*, sr.requester_id, sr.provider_id, cf.number_case AS case_number,
            u.first_name AS specialist_first_name, u.last_name AS specialist_last_name,
            sp.specialty
       FROM service_reports r
       JOIN service_requests sr ON sr.id = r.request_id
       JOIN case_files cf ON cf.id = sr.case_file_id
       JOIN users u ON u.id = r.provider_id
       LEFT JOIN specialist_profiles sp ON sp.user_id = r.provider_id
      WHERE ($1::boolean OR sr.requester_id = $2 OR sr.provider_id = $2 OR sr.assigned_staff_id = $2)
      ORDER BY r.created_at DESC NULLS LAST`,
    [isAdmin, user.id]
  );
  const reports = reportResult.rows.map((row) => {
    const clientView = !isAdmin && Number(row.requester_id) === Number(user.id);
    return {
      id: Number(row.id),
      caseNumber: row.case_number,
      specialistId: Number(row.provider_id),
      specialistName: displayName(row.specialist_first_name, row.specialist_last_name),
      specialty: row.specialty || '',
      evaluation: clientView ? '' : decryptValue(row.assessment || ''),
      professionalNotes: clientView ? '' : decryptValue(row.professional_notes || ''),
      recommendations: clientView
        ? decryptValue(row.client_summary || '')
        : decryptValue(row.recommendations || ''),
      treatmentPlan: clientView ? '' : decryptValue(row.treatment_plan || ''),
      nextAppointment: row.next_appointment || '',
      createdAt: dateText(row.created_at),
    };
  });

  const paymentResult = await pool.query(
    `SELECT p.*, sr.id AS request_id, cf.number_case AS case_number, s.title AS service_title,
            cu.first_name AS client_first_name, cu.last_name AS client_last_name,
            pu.first_name AS provider_first_name, pu.last_name AS provider_last_name,
            pt.gateway_transaction_id, pt.status AS transaction_status, pt.created_at AS transaction_created_at
       FROM payments p
       JOIN service_requests sr ON sr.id = p.request_id
       JOIN case_files cf ON cf.id = sr.case_file_id
       JOIN services s ON s.id = sr.service_id
       JOIN users cu ON cu.id = p.user_id
       JOIN users pu ON pu.id = p.provider_id
       LEFT JOIN LATERAL (
         SELECT gateway_transaction_id, status, created_at FROM payment_transactions
          WHERE payment_id = p.id ORDER BY created_at DESC LIMIT 1
       ) pt ON true
      WHERE ($1::boolean OR p.user_id = $2 OR p.provider_id = $2)
      ORDER BY p.created_at DESC NULLS LAST`,
    [isAdmin, user.id]
  );
  const transactions = paymentResult.rows.map((row) => ({
    id: Number(row.id),
    paymentId: String(row.id),
    orderId: String(row.request_id),
    clientId: Number(row.user_id),
    clientName: displayName(row.client_first_name, row.client_last_name),
    providerId: Number(row.provider_id),
    providerName: displayName(row.provider_first_name, row.provider_last_name),
    serviceTitle: row.service_title,
    amountDzd: Number(row.amount_dzd),
    currency: row.currency.toUpperCase(),
    paymentMethod: row.payment_method === 'cib' ? 'CIB' : 'EDAHABIA',
    transactionId: row.gateway_transaction_id || '',
    caseNumber: row.case_number,
    status:
      row.status === 'PAID' ? 'SUCCESSFUL'
        : row.status === 'REFUNDED' ? 'REFUNDED'
          : row.status === 'FAILED' ? 'FAILED'
            : row.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
    createdAt: dateText(row.transaction_created_at || row.created_at),
    paidAt: row.paid_at ? dateText(row.paid_at) : null,
  }));

  const notificationsResult = await pool.query(
    `SELECT id, user_id, title, message, type, link, is_read, created_at
       FROM notifications WHERE user_id = $1
      ORDER BY created_at DESC NULLS LAST LIMIT 200`,
    [user.id]
  );
  const notifications = notificationsResult.rows.map((row) => ({
    id: Number(row.id),
    userId: Number(row.user_id),
    title: row.title,
    message: row.message,
    timestamp: dateText(row.created_at),
    isRead: Boolean(row.is_read),
    type: row.type || 'STATUS',
    link: row.link || undefined,
  }));

  let auditLogs = [];
  if (isAdmin) {
    const result = await pool.query(
      `SELECT id, user_id, action, entity_type, entity_id, details, ip_address, created_at
         FROM audit_logs ORDER BY created_at DESC NULLS LAST LIMIT 300`
    );
    auditLogs = result.rows.map((row) => ({
      id: Number(row.id),
      timestamp: dateText(row.created_at),
      userId: Number(row.user_id || 0),
      userName: '',
      action: row.action,
      details: row.details || '',
      ipAddress: row.ip_address || '',
    }));
  }

  const followUpResult = await pool.query(
    `SELECT tf.*, cf.number_case AS case_number, sr.requester_id, sr.provider_id,
            cu.first_name AS client_first_name, cu.last_name AS client_last_name,
            pu.first_name AS specialist_first_name, pu.last_name AS specialist_last_name
       FROM treatment_follow_ups tf
       JOIN case_files cf ON cf.id = tf.case_file_id
       JOIN service_requests sr ON sr.case_file_id = cf.id
       JOIN users cu ON cu.id = sr.requester_id
       JOIN users pu ON pu.id = sr.provider_id
      WHERE ($1::boolean OR sr.requester_id = $2 OR sr.provider_id = $2)
      ORDER BY tf.created_at DESC NULLS LAST`,
    [isAdmin, user.id]
  );
  const followUps = followUpResult.rows.map((row) => ({
    id: Number(row.id),
    caseNumber: row.case_number,
    clientId: Number(row.requester_id),
    clientName: displayName(row.client_first_name, row.client_last_name),
    specialistId: Number(row.provider_id),
    specialistName: displayName(row.specialist_first_name, row.specialist_last_name),
    date: dateText(row.created_at).slice(0, 10),
    notes: decryptValue(row.medical_notes || ''),
    progress: row.status_summary || 'مستقر',
    currentPlan: '',
    recommendations: '',
    nextAppointment: '',
    createdAt: dateText(row.created_at),
  }));

  const conversationsResult = await pool.query(
    `SELECT c.id, cf.number_case AS case_number, c.title,
            COALESCE(m.content, '') AS last_message, m.created_at AS last_message_at
       FROM conversation_participants cp
       JOIN conversations c ON c.id = cp.conversation_id
       JOIN case_files cf ON cf.id = c.case_file_id
       LEFT JOIN LATERAL (
         SELECT content, created_at FROM messages
          WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
       ) m ON true
      WHERE cp.user_id = $1
      ORDER BY m.created_at DESC NULLS LAST`,
    [user.id]
  );
  const conversations = conversationsResult.rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    caseNumber: row.case_number,
    lastMessage: decryptValue(row.last_message || ''),
    lastMessageTime: row.last_message_at ? dateText(row.last_message_at) : '',
    unreadCount: 0,
  }));

  const messagesMap = {};
  if (conversations.length) {
    const messageResult = await pool.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
              u.first_name, u.last_name
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE cp.user_id = $1 AND m.conversation_id = ANY($2::integer[])
        ORDER BY m.created_at`,
      [user.id, conversations.map((conversation) => conversation.id)]
    );
    for (const row of messageResult.rows) {
      const conversationId = Number(row.conversation_id);
      messagesMap[conversationId] ||= [];
      messagesMap[conversationId].push({
        id: Number(row.id),
        conversationId,
        senderName: displayName(row.first_name, row.last_name),
        content: decryptValue(row.content || ''),
        timestamp: dateText(row.created_at),
        isFromMe: Number(row.sender_id) === Number(user.id),
      });
    }
  }

  const centersResult = await pool.query(
    `SELECT c.id, c.name, c.address, c.phone, c.services, w.name_ar AS wilaya_name
       FROM centers c LEFT JOIN wilayas w ON w.id = c.wilaya_id
      WHERE c.verification_status = 'approved' ORDER BY w.code, c.name`
  );
  const centers = centersResult.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    wilayaName: row.wilaya_name || '',
    address: row.address || '',
    phone: row.phone || '',
    services: row.services || '',
  }));

  const associationResult = await pool.query(
    `SELECT a.id, a.name, a.address, a.phone, a.services, w.name_ar AS wilaya_name
       FROM associations a LEFT JOIN wilayas w ON w.id = a.wilaya_id
      WHERE a.verification_status = 'approved' ORDER BY w.code, a.name`
  );
  const associations = associationResult.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    wilayaName: row.wilaya_name || '',
    address: row.address || '',
    phone: row.phone || '',
    services: row.services || '',
  }));

  const partners = [
    ...centers.map((center) => ({
      id: `center-${center.id}`,
      name: center.name,
      category: 'مستشفى',
      description: center.services,
      isVisible: true,
    })),
    ...associations.map((association) => ({
      id: `association-${association.id}`,
      name: association.name,
      category: 'جمعية',
      description: association.services,
      isVisible: true,
    })),
  ];

  return {
    user: safeUser(user),
    users,
    services,
    requests,
    appointments,
    reports,
    transactions,
    auditLogs,
    partners,
    followUps,
    notifications,
    conversations,
    messagesMap,
    centers,
    associations,
    dataRetentionPolicy: 'مدى الحياة',
  };
}

export async function findRequestForUser(requestId, user, client = pool) {
  const result = await client.query(
    `SELECT sr.*, cf.id AS case_file_id, cf.number_case AS case_number, cf.description,
            cu.first_name AS client_first_name, cu.last_name AS client_last_name,
            pu.first_name AS provider_first_name, pu.last_name AS provider_last_name,
            s.title AS service_title, s.category,
            a.id AS appointment_id, a.appointment_date, a.start_time AS appointment_time
       FROM service_requests sr
       JOIN case_files cf ON cf.id = sr.case_file_id
       JOIN users cu ON cu.id = sr.requester_id
       JOIN users pu ON pu.id = sr.provider_id
       JOIN services s ON s.id = sr.service_id
       LEFT JOIN appointments a ON a.id = sr.appointment_id
      WHERE sr.id = $1
        AND ($2::boolean OR sr.requester_id = $3 OR sr.provider_id = $3 OR sr.assigned_staff_id = $3)
      LIMIT 1`,
    [requestId, user.role_slug === 'admin', user.id]
  );
  return result.rows[0] || null;
}

export const professionalRoles = PROFESSIONAL_ROLES;
