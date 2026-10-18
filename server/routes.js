import crypto from 'node:crypto';
import { pool, withTransaction } from './db.js';
import {
  clearCookieHeader,
  cookieHeader,
  createSessionToken,
  decryptValue,
  encryptValue,
  hashPassword,
  HttpError,
  parseCookies,
  readSessionToken,
  safeUser,
  sessionMaxAge,
  verifyPassword,
} from './security.js';
import { loadBootstrap, findRequestForUser, professionalRoles } from './data.js';
import { createChargilyCheckout, handleChargilyWebhook } from './payments.js';

const COOKIE_NAME = 'scp_session';
const allowedPriorities = new Set(['Critical', 'High', 'Medium', 'Low']);
const allowedStatuses = new Set([
  'ACCEPTED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
const providerRoles = new Set(professionalRoles);
const legalReferencePdfKeyPrefix = 'legal_reference_pdf:';
const legalReferencePdfMaxBytes = 5 * 1024 * 1024;
const defaultLegalReferences = [
  {
    id: '04-18',
    title: 'القانون رقم 04-18 المؤرخ في 25 ديسمبر 2004',
    ref: 'الجريدة الرسمية عدد 83',
    summary: 'الوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها، وتعزيز سبل التكفل بالعلاج الطوعي.',
  },
  {
    id: '25-03',
    title: 'القانون رقم 25-03 المؤرخ في 1 يوليو 2025',
    ref: 'الجريدة الرسمية عدد 43',
    summary: 'تعديل وتتميم القانون 04-18 بإدراج فحوصات الكشف المسبق عند التوظيف، تعزيز حماية القصر، والتكفل بإعادة الإدماج الاجتماعي.',
  },
  {
    id: '26-76',
    title: 'المرسوم التنفيذي رقم 26-76 المؤرخ في 14 جانفي 2026',
    ref: 'الجريدة الرسمية عدد 08',
    summary: 'تحديد شروط وكيفيات إجراء التحاليل الطبية عند التوظيف والسر المهني ومعاقبة إفشاء النتائج وضمان عدم إقصاء المتعافين.',
  },
  {
    id: '18-07',
    title: 'القانون رقم 18-07 المؤرخ في 10 يونيو 2018 (25 رمضان 1439)',
    ref: 'الجريدة الرسمية عدد 34',
    summary: 'حماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي، المعدل والمتمم، وفرض التشفير الكامل للملفات الطبية والقضائية.',
  },
];

function json(res, status, body, headers = {}) {
  if (res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
}

async function rawBody(req, limit = 2 * 1024 * 1024) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > limit) throw new HttpError(413, 'حجم الطلب أكبر من الحد المسموح.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function bodyJson(req, limit) {
  const raw = await rawBody(req, limit);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new HttpError(400, 'صيغة البيانات المرسلة غير صالحة.');
  }
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validatePassword(value) {
  return typeof value === 'string' && value.length >= 10 && value.length <= 128;
}

function clientIp(req) {
  return req.socket?.remoteAddress || null;
}

async function addAudit(client, userId, action, entityType, entityId, details, req) {
  await client.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [userId || null, action, entityType, entityId == null ? null : String(entityId), details || null, clientIp(req)]
  );
}

async function addNotification(client, userId, title, message, type = 'STATUS', link = null) {
  if (!userId) return;
  await client.query(
    `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, 0, NOW())`,
    [userId, title, message, type, link]
  );
}

async function getUserProfile(userId, client = pool) {
  const result = await client.query(
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
    [userId]
  );
  return result.rows[0] || null;
}

async function currentUser(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  const session = readSessionToken(token);
  if (!session) return null;
  const row = await getUserProfile(session.sub);
  if (!row || ['suspended', 'inactive', 'rejected'].includes(row.status)) return null;
  return row;
}

async function requireUser(req) {
  const user = await currentUser(req);
  if (!user) throw new HttpError(401, 'يرجى تسجيل الدخول للمتابعة.');
  return user;
}

function requireAdmin(user) {
  if (user.role_slug !== 'admin') throw new HttpError(403, 'هذه العملية مخصصة للإدارة.');
}

function requireActive(user) {
  if (user.status !== 'active') throw new HttpError(403, 'الحساب قيد الاعتماد ولا يمكنه تنفيذ هذه العملية بعد.');
}

function sameSiteCookie() {
  try {
    const frontend = new URL(process.env.FRONTEND_URL);
    const backend = new URL(process.env.PUBLIC_BACKEND_URL);
    const sameSite = frontend.hostname === backend.hostname ? 'Lax' : 'None';
    const secure = sameSite === 'None' || process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return { sameSite, secure };
  } catch {
    return { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' ? '; Secure' : '' };
  }
}

function sessionCookie(token, rememberMe = false) {
  const { sameSite, secure } = sameSiteCookie();
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=${sameSite}; Path=/; Max-Age=${sessionMaxAge(rememberMe)}${secure}`;
}

function wilayaCode(value) {
  const match = String(value || '').match(/^\s*(\d{1,2})/);
  return match ? match[1].padStart(2, '0') : '';
}

async function lookupWilayaId(value, client) {
  const code = wilayaCode(value);
  if (!code) return null;
  const result = await client.query('SELECT id FROM wilayas WHERE code = $1 LIMIT 1', [code]);
  return result.rows[0]?.id ?? null;
}

async function roleIdFor(roleSlug, client) {
  const lookup = {
    legal_advisor: 'lawyer',
    doctor: 'psychologist',
    clinic: 'treatment_center',
    hospital: 'treatment_center',
  };
  const result = await client.query(
    'SELECT id FROM roles WHERE slug = $1 LIMIT 1',
    [lookup[roleSlug] || roleSlug]
  );
  if (result.rows[0]) return Number(result.rows[0].id);
  const fallback = await client.query('SELECT id FROM roles WHERE slug IN ($1, $2) ORDER BY id LIMIT 1', [
    roleSlug === 'association' ? 'association' : 'family',
    'family',
  ]);
  if (!fallback.rows[0]) throw new HttpError(500, 'جدول أدوار الحسابات غير مهيأ.');
  return Number(fallback.rows[0].id);
}

function accountStatus(roleSlug) {
  return providerRoles.has(roleSlug) ? 'pending_approval' : 'active';
}

async function insertProfessionalProfile(client, userId, input) {
  const role = input.roleSlug;
  const specialty = String(input.specialty || (
    role === 'lawyer' || role === 'legal_advisor'
      ? 'مستشار قانوني'
      : role === 'psychologist'
        ? 'أخصائي نفسي عيادي'
        : role === 'doctor'
          ? 'أخصائي نفسي عيادي'
          : ''
  )).trim();
  const license = String(input.licenseNumber || '').trim();

  if (['psychologist', 'doctor', 'lawyer', 'legal_advisor'].includes(role)) {
    if (!specialty || !license) {
      throw new HttpError(400, 'يلزم إدخال التخصص ورقم الاعتماد المهني لمراجعة الحساب.');
    }
    await client.query(
      `INSERT INTO specialist_profiles
         (user_id, specialty, license_number, bio, verification_status, availability_schedule, created_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [
        userId,
        specialty,
        license,
        input.bio ? encryptValue(String(input.bio)) : null,
        JSON.stringify(Array.isArray(input.availabilitySlots) ? input.availabilitySlots : []),
      ]
    );
    return;
  }

  if (['clinic', 'hospital', 'treatment_center'].includes(role)) {
    const wilayaId = await lookupWilayaId(input.wilayaName, client);
    if (!wilayaId || !input.organizationName || !input.address) {
      throw new HttpError(400, 'يلزم إدخال اسم المؤسسة والولاية والعنوان للتحقق منها.');
    }
    await client.query(
      `INSERT INTO centers (user_id, name, wilaya_id, address, phone, services, verification_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
      [userId, input.organizationName, wilayaId, input.address, input.phone, input.servicesOffered || '']
    );
  }

  if (role === 'association') {
    const wilayaId = await lookupWilayaId(input.wilayaName, client);
    if (!wilayaId || !input.organizationName || !input.address) {
      throw new HttpError(400, 'يلزم إدخال اسم الجمعية والولاية والعنوان للتحقق منها.');
    }
    await client.query(
      `INSERT INTO associations (user_id, name, wilaya_id, address, phone, services, verification_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
      [userId, input.organizationName, wilayaId, input.address, input.phone, input.servicesOffered || '']
    );
  }
}

async function createUser(input, actor, req, selfRegistration = false) {
  const roleSlug = String(input.roleSlug || '');
  const email = normalizeEmail(input.email);
  const password = input.password;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'أدخل بريدًا إلكترونيًا صالحًا.');
  if (!validatePassword(password)) throw new HttpError(400, 'يجب أن تتكون كلمة المرور من 10 أحرف على الأقل.');
  if (!['family', 'patient', 'user', ...professionalRoles].includes(roleSlug)) {
    throw new HttpError(400, 'نوع الحساب غير مدعوم.');
  }
  if (selfRegistration && input.consentAccepted !== true) {
    throw new HttpError(400, 'يجب الموافقة على معالجة البيانات الضرورية لإنشاء الحساب.');
  }
  if (!String(input.firstName || '').trim() || !String(input.lastName || '').trim() || !String(input.phone || '').trim()) {
    throw new HttpError(400, 'الاسم والهاتف مطلوبان لإنشاء الحساب.');
  }

  let created;
  try {
    created = await withTransaction(async (client) => {
      const roleId = await roleIdFor(roleSlug, client);
      const wilayaId = await lookupWilayaId(input.wilayaName, client);
      const inserted = await client.query(
      `INSERT INTO users
         (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id,
          is_verified, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id`,
        [
          String(input.firstName).trim().slice(0, 100),
          String(input.lastName).trim().slice(0, 100),
          email,
          String(input.phone).trim().slice(0, 30),
          await hashPassword(password),
          roleId,
          roleSlug,
          wilayaId,
          providerRoles.has(roleSlug) ? 0 : 1,
          selfRegistration ? accountStatus(roleSlug) : String(input.status || accountStatus(roleSlug)),
        ]
      );
      const id = Number(inserted.rows[0].id);
      if (providerRoles.has(roleSlug)) await insertProfessionalProfile(client, id, input);

      if (selfRegistration) {
        await addAudit(
          client,
          id,
          'PRIVACY_CONSENT_GIVEN',
          'user',
          id,
          'موافقة المستخدم على معالجة الحد الأدنى من البيانات اللازمة للخدمة؛ الإصدار 1.',
          req
        );
      }
      await addAudit(client, actor?.id || id, 'USER_CREATED', 'user', id, `تم إنشاء حساب بدور ${roleSlug}.`, req);
      return getUserProfile(id, client);
    });
  } catch (error) {
    if (error?.code === '23505') {
      throw new HttpError(409, 'هذا البريد الإلكتروني مسجل بالفعل. سجّل الدخول أو استخدم بريدًا آخر.');
    }
    throw error;
  }
  return created;
}

async function saveDefaultConsultationService(client, user) {
  const category = ['lawyer', 'legal_advisor'].includes(user.role_slug)
    ? 'legal'
    : user.role_slug === 'psychologist' ? 'psychological' : null;
  if (!category) return;
  const exists = await client.query(
    'SELECT id FROM services WHERE provider_id = $1 AND category = $2 AND is_active = 1 LIMIT 1',
    [user.id, category]
  );
  if (exists.rowCount) return;
  const title = category === 'legal' ? 'استشارة قانونية مباشرة' : 'استشارة نفسية مباشرة';
  const description = category === 'legal'
    ? 'استشارة مباشرة مع مستشار قانوني مؤهل. لا تمثل رأيًا قانونيًا آليًا.'
    : 'استشارة مباشرة مع أخصائي نفسي عيادي مؤهل. لا تقدم تشخيصًا طبيًا آليًا.';
  await client.query(
    `INSERT INTO services (provider_id, title, description, amount_dzd, category, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, 500, $4, 1, NOW(), NOW())`,
    [user.id, title, description, category]
  );
}

async function updateRequest(requestId, body, user, req) {
  const target = await findRequestForUser(requestId, user);
  if (!target) throw new HttpError(404, 'الطلب غير موجود أو لا تملك صلاحية الوصول إليه.');
  const isProvider = Number(target.provider_id) === Number(user.id);
  const isRequester = Number(target.requester_id) === Number(user.id);
  const isAdmin = user.role_slug === 'admin';
  const requesterCancellation =
    isRequester && body.status === 'CANCELLED' &&
    ['PENDING_PROVIDER', 'NEW', 'WAITING_PAYMENT'].includes(target.status) &&
    target.payment_status !== 'PAID';
  if (!isAdmin && !isProvider && !requesterCancellation) {
    throw new HttpError(403, 'لا يملك هذا الحساب صلاحية تحديث حالة الطلب.');
  }
  requireActive(user);

  const updates = [];
  const params = [];
  let nextStatus = target.status;
  let paymentStatus = target.payment_status;
  let action = 'REQUEST_UPDATED';
  let detail = '';
  let refundPayment = null;

  if (body.priority !== undefined) {
    if (!allowedPriorities.has(body.priority)) throw new HttpError(400, 'درجة الأولوية غير صالحة.');
    params.push(body.priority);
    updates.push(`priority = $${params.length}`);
    action = 'REQUEST_PRIORITY_CHANGED';
  }

  if (body.status !== undefined) {
    if (!allowedStatuses.has(body.status)) throw new HttpError(400, 'حالة الطلب المطلوبة غير صالحة.');
    if (user.role_slug !== 'admin' && !isProvider) throw new HttpError(403, 'غير مصرح بتغيير حالة الطلب.');
    if (body.status === 'ACCEPTED') {
      if (!['PENDING_PROVIDER', 'NEW'].includes(target.status)) throw new HttpError(409, 'لا يمكن قبول الطلب في حالته الحالية.');
      nextStatus = Number(target.amount_dzd) > 0 ? 'WAITING_PAYMENT' : 'ACCEPTED';
      paymentStatus = Number(target.amount_dzd) > 0 ? 'PENDING' : 'NOT_REQUIRED';
      action = 'REQUEST_ACCEPTED';
      detail = Number(target.amount_dzd) > 0
        ? 'وافق مقدم الخدمة على الطلب؛ بانتظار الدفع لتأكيد الموعد.'
        : 'وافق مقدم الخدمة على الطلب.';
    } else if (body.status === 'REJECTED') {
      const reason = String(body.rejectionReason || '').trim();
      if (reason.length < 5) throw new HttpError(400, 'أدخل سبب رفض واضحًا قبل المتابعة.');
      nextStatus = 'REJECTED';
      action = 'REQUEST_REJECTED';
      detail = reason.slice(0, 500);
      const paid = await pool.query(
        `SELECT id, amount_dzd FROM payments WHERE request_id = $1 AND status = 'PAID' ORDER BY created_at DESC LIMIT 1`,
        [requestId]
      );
      if (paid.rows[0]) {
        refundPayment = paid.rows[0];
        paymentStatus = 'REFUND_PENDING';
      }
    } else if (body.status === 'CANCELLED' && requesterCancellation) {
      nextStatus = 'CANCELLED';
      action = 'REQUEST_CANCELLED';
      detail = 'ألغى المستفيد الطلب قبل تأكيد الدفع.';
    } else if (body.status === 'COMPLETED') {
      if (target.payment_status !== 'PAID' && Number(target.amount_dzd) > 0) {
        throw new HttpError(409, 'لا يمكن إكمال خدمة مدفوعة قبل تأكيد الدفع.');
      }
      nextStatus = 'COMPLETED';
      action = 'REQUEST_COMPLETED';
      detail = 'تم تسجيل اكتمال الخدمة من مقدمها.';
    } else if (body.status === 'IN_PROGRESS') {
      if (Number(target.amount_dzd) > 0 && target.payment_status !== 'PAID') {
        throw new HttpError(409, 'لا يمكن بدء خدمة مدفوعة قبل التحقق من الدفع.');
      }
      if (!['APPOINTMENT_CONFIRMED', 'IN_PROGRESS'].includes(target.status)) {
        throw new HttpError(409, 'لا يمكن بدء الخدمة قبل تأكيد الموعد.');
      }
      nextStatus = 'IN_PROGRESS';
      action = 'REQUEST_IN_PROGRESS';
      detail = 'بدأ مقدم الخدمة متابعة الطلب.';
    } else {
      nextStatus = body.status;
      action = `REQUEST_${body.status}`;
      detail = String(body.details || '').slice(0, 500);
    }
  }

  if (!updates.some((item) => item.startsWith('status ='))) {
    params.push(nextStatus);
    updates.push(`status = $${params.length}`);
  }
  params.push(paymentStatus);
  updates.push(`payment_status = $${params.length}`);
  if (body.rejectionReason !== undefined) {
    params.push(String(body.rejectionReason).trim().slice(0, 500));
    updates.push(`rejection_reason = $${params.length}`);
  }
  params.push(requestId);

  await withTransaction(async (client) => {
    if (refundPayment) {
      await client.query(
        `INSERT INTO refunds (payment_id, requested_by, amount_dzd, status, reason, created_at, updated_at)
         VALUES ($1, $2, $3, 'PENDING', $4, NOW(), NOW())`,
        [refundPayment.id, user.id, refundPayment.amount_dzd, `رفض مقدم الخدمة بعد تأكيد الدفع: ${detail}`]
      );
      await client.query(
        `UPDATE payments SET status = 'REFUND_PENDING' WHERE id = $1`,
        [refundPayment.id]
      );
    }
    await client.query(
      `UPDATE service_requests SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
      params
    );
    const caseStatus = nextStatus === 'COMPLETED' ? 'COMPLETED'
      : nextStatus === 'IN_PROGRESS' ? 'FIRST_SESSION'
        : nextStatus === 'REJECTED' ? 'ARCHIVED' : 'UNDER_REVIEW';
    await client.query(
      'UPDATE case_files SET status = $2, priority = COALESCE($3, priority), updated_at = NOW() WHERE id = $1',
      [target.case_file_id, caseStatus, body.priority ?? null]
    );
    if (nextStatus === 'REJECTED' || nextStatus === 'CANCELLED') {
      await client.query(
        `UPDATE appointments SET status = 'CANCELLED', cancellation_reason = $2
          WHERE id = $1 AND status IN ('PENDING', 'CONFIRMED')`,
        [target.appointment_id, detail]
      );
    }
    await client.query(
      `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [requestId, user.id, action, target.status, nextStatus, detail || null]
    );
    await addAudit(client, user.id, action, 'service_request', requestId, detail, req);
    if (nextStatus === 'ACCEPTED' || nextStatus === 'WAITING_PAYMENT') {
      await addNotification(
        client,
        target.requester_id,
        'تمت الموافقة على طلبك',
        nextStatus === 'WAITING_PAYMENT'
          ? 'وافق مقدم الخدمة على الطلب. أكمل الدفع لتأكيد الموعد.'
          : 'وافق مقدم الخدمة على الطلب.',
        'REQUEST',
        `/requests/${requestId}`
      );
    } else if (nextStatus === 'REJECTED') {
      await addNotification(
        client,
        target.requester_id,
        'تم رفض الطلب',
        `سبب الرفض: ${detail}${paymentStatus === 'REFUND_PENDING' ? ' يجري تسجيل طلب استرجاع المبلغ.' : ''}`,
        'STATUS',
        `/requests/${requestId}`
      );
    } else if (nextStatus === 'CANCELLED') {
      await addNotification(
        client,
        target.provider_id,
        'أُلغي طلب استشارة',
        'ألغى المستفيد الطلب قبل تأكيد الدفع.',
        'REQUEST',
        `/requests/${requestId}`
      );
    } else if (nextStatus === 'COMPLETED') {
      await addNotification(client, target.requester_id, 'اكتملت الخدمة', 'تم تسجيل اكتمال طلبك.', 'STATUS', `/requests/${requestId}`);
    }
  });
  return { ok: true };
}

async function createRequest(body, user, req) {
  requireActive(user);
  if (!['family', 'patient', 'user'].includes(user.role_slug)) {
    throw new HttpError(403, 'يجب استخدام حساب مستفيد لإنشاء طلب استشارة.');
  }
  if (body.consentAccepted !== true) {
    throw new HttpError(400, 'يجب الموافقة على معالجة بيانات الاستشارة الحساسة لإرسال الطلب.');
  }
  const providerId = Number(body.providerId);
  if (!Number.isInteger(providerId) || providerId < 1) {
    throw new HttpError(400, 'اختر مقدم خدمة معتمدًا قبل إرسال الطلب.');
  }
  const category = String(body.category || '');
  if (!['legal', 'psychological'].includes(category)) {
    throw new HttpError(400, 'هذا المسار مخصص للاستشارات القانونية أو النفسية المدفوعة.');
  }
  const description = String(body.description || '').trim();
  if (description.length < 5 || description.length > 5000) {
    throw new HttpError(400, 'اكتب وصفًا مختصرًا بين 5 و5000 حرف.');
  }
  const priority = allowedPriorities.has(body.priority) ? body.priority : 'Medium';

  const created = await withTransaction(async (client) => {
    const serviceResult = await client.query(
      `SELECT s.*, u.role_slug, u.status AS provider_status, u.is_verified,
              sp.verification_status AS specialist_verification,
              c.verification_status AS center_verification,
              a.verification_status AS association_verification
         FROM services s
         JOIN users u ON u.id = s.provider_id
         LEFT JOIN specialist_profiles sp ON sp.user_id = u.id
         LEFT JOIN centers c ON c.user_id = u.id
         LEFT JOIN associations a ON a.user_id = u.id
        WHERE s.provider_id = $1 AND s.category = $2 AND s.is_active = 1
        ORDER BY s.id LIMIT 1`,
      [providerId, category]
    );
    const service = serviceResult.rows[0];
    if (
      !service ||
      service.provider_status !== 'active' ||
      !service.is_verified ||
      (service.specialist_verification || service.center_verification || service.association_verification || 'approved') !== 'approved'
    ) {
      throw new HttpError(409, 'هذا المقدم غير متاح لهذه الخدمة أو لم يكتمل اعتماده.');
    }
    const roleMatchesCategory = category === 'legal'
      ? ['lawyer', 'legal_advisor'].includes(service.role_slug)
      : service.role_slug === 'psychologist';
    if (!roleMatchesCategory) {
      throw new HttpError(409, 'لا يملك هذا الحساب الاعتماد المهني المطلوب لهذه الاستشارة.');
    }
    if (Number(service.amount_dzd) !== 500) {
      throw new HttpError(409, 'تعذر إرسال الطلب لأن سعر الاستشارة لا يطابق السعر المعتمد 500 دج.');
    }

    let addiction = await client.query(
      `SELECT id FROM addiction_types WHERE name_ar = 'غير مصنف' ORDER BY id LIMIT 1`
    );
    if (!addiction.rowCount) {
      addiction = await client.query(
        `INSERT INTO addiction_types (name_ar, name_en, description, is_active, created_at)
         VALUES ('غير مصنف', 'Unclassified', 'قيمة تنظيمية للطلبات غير التشخيصية؛ لا تمثل تشخيصًا طبيًا.', 1, NOW())
         RETURNING id`
      );
    }
    const caseNumber = `SCP-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const caseResult = await client.query(
      `INSERT INTO case_files
         (number_case, created_by, patient_id, addiction_type_id, priority, status,
          description, target_response_hours, created_at, updated_at)
       VALUES ($1, $2, $2, $3, $4, 'NEW', $5, 72, NOW(), NOW())
       RETURNING id`,
      [caseNumber, user.id, addiction.rows[0].id, priority, encryptValue(description)]
    );
    const caseFileId = Number(caseResult.rows[0].id);

    let appointmentId = null;
    const date = String(body.appointmentDate || '');
    const start = String(body.appointmentTime || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}/.test(start)) {
      throw new HttpError(400, 'اختر موعدًا متاحًا قبل إرسال طلب الاستشارة.');
    }
    const startTime = start.slice(0, 5);
    const [hour, minute] = startTime.split(':').map(Number);
    if (
      !Number.isInteger(hour) || !Number.isInteger(minute) ||
      hour < 0 || hour > 23 || minute < 0 || minute > 59 ||
      date < new Date().toISOString().slice(0, 10)
    ) {
      throw new HttpError(400, 'تاريخ أو وقت الموعد غير صالح.');
    }
    const duration = category === 'psychological' ? 50 : 30;
    const endMinutes = hour * 60 + minute + duration;
    if (endMinutes >= 24 * 60) {
      throw new HttpError(400, 'اختر وقتًا يسمح بإكمال مدة الاستشارة في اليوم نفسه.');
    }
    const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    const conflict = await client.query(
      `SELECT id FROM appointments
        WHERE specialist_id = $1 AND appointment_date = $2 AND start_time = $3
          AND status IN ('PENDING', 'CONFIRMED')
        FOR UPDATE`,
      [providerId, date, startTime]
    );
    if (conflict.rowCount) throw new HttpError(409, 'اختير هذا الموعد للتو. اختر وقتًا آخر.');
    const appointment = await client.query(
      `INSERT INTO appointments
         (case_file_id, created_by, specialist_id, appointment_date, start_time,
          end_time, type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW())
       RETURNING id`,
      [caseFileId, user.id, providerId, date, startTime, endTime, category]
    );
    appointmentId = Number(appointment.rows[0].id);

    const requestResult = await client.query(
      `INSERT INTO service_requests
         (case_file_id, requester_id, provider_id, service_id, addiction_type_id,
          amount_dzd, payment_status, status, priority, description,
          appointment_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 500, 'PENDING', 'PENDING_PROVIDER', $6, $7, $8, NOW(), NOW())
       RETURNING id`,
      [
        caseFileId,
        user.id,
        providerId,
        service.id,
        addiction.rows[0].id,
        priority,
        encryptValue(description),
        appointmentId,
      ]
    );
    const requestId = Number(requestResult.rows[0].id);
    const conversation = await client.query(
      `INSERT INTO conversations (case_file_id, title, created_at)
       VALUES ($1, $2, NOW()) RETURNING id`,
      [caseFileId, service.title]
    );
    await client.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
       VALUES ($1, $2, NOW()), ($1, $3, NOW())
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conversation.rows[0].id, user.id, providerId]
    );
    await client.query(
      `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details, created_at)
       VALUES ($1, $2, 'REQUEST_CREATED', NULL, 'PENDING_PROVIDER', 'أرسل المستفيد طلب استشارة مع الموافقة على معالجة بياناتها.', NOW())`,
      [requestId, user.id]
    );
    const clientName = `${user.first_name} ${user.last_name}`.trim();
    await addNotification(
      client,
      providerId,
      'طلب استشارة جديد',
      'وصلك طلب جديد بانتظار المراجعة.',
      'REQUEST',
      `/requests/${requestId}`
    );
    await addAudit(client, user.id, 'REQUEST_CREATED', 'service_request', requestId, `تم إنشاء الطلب ${caseNumber}.`, req);
    return requestId;
  });
  return { id: created, message: 'تم إرسال الطلب إلى مقدم الخدمة.' };
}

async function setAppointmentStatus(appointmentId, status, user, req) {
  if (!['CONFIRMED', 'COMPLETED', 'CANCELLED', 'PENDING'].includes(status)) {
    throw new HttpError(400, 'حالة الموعد غير صالحة.');
  }
  requireActive(user);
  await withTransaction(async (client) => {
    const found = await client.query(
      `SELECT a.*, sr.requester_id, sr.provider_id, sr.id AS request_id,
              sr.status AS request_status, sr.payment_status, sr.amount_dzd
         FROM appointments a
         JOIN case_files cf ON cf.id = a.case_file_id
         JOIN service_requests sr ON sr.case_file_id = cf.id
        WHERE a.id = $1 FOR UPDATE`,
      [appointmentId]
    );
    const appointment = found.rows[0];
    if (!appointment) throw new HttpError(404, 'الموعد غير موجود.');
    if (user.role_slug !== 'admin' && Number(appointment.provider_id) !== Number(user.id)) {
      throw new HttpError(403, 'لا تملك صلاحية تحديث هذا الموعد.');
    }
    if (status === 'CONFIRMED' && appointment.payment_status !== 'PAID' && Number(appointment.amount_dzd) > 0) {
      throw new HttpError(409, 'لا يمكن تأكيد موعد مدفوع قبل التحقق من الدفع.');
    }
    if (
      status === 'COMPLETED' &&
      Number(appointment.amount_dzd) > 0 &&
      appointment.payment_status !== 'PAID'
    ) {
      throw new HttpError(409, 'لا يمكن إنهاء خدمة مدفوعة قبل تأكيد الدفع.');
    }
    if (status === 'CONFIRMED' && !['WAITING_PAYMENT', 'APPOINTMENT_CONFIRMED'].includes(appointment.request_status)) {
      throw new HttpError(409, 'لا يمكن تأكيد الموعد قبل قبول الطلب وإتمام الدفع.');
    }
    await client.query('UPDATE appointments SET status = $2 WHERE id = $1', [appointmentId, status]);
    if (status === 'COMPLETED') {
      await client.query(
        `UPDATE service_requests SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1`,
        [appointment.request_id]
      );
    }
    await client.query(
      `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details, created_at)
       VALUES ($1, $2, 'APPOINTMENT_UPDATED', $3, $4, $5, NOW())`,
      [appointment.request_id, user.id, appointment.request_status, status, `تم تحديث الموعد إلى ${status}.`]
    );
    await addAudit(client, user.id, 'APPOINTMENT_UPDATED', 'appointment', appointmentId, status, req);
    await addNotification(
      client,
      appointment.requester_id,
      'تحديث الموعد',
      `تم تحديث حالة موعدك إلى ${status}.`,
      'APPOINTMENT',
      `/requests/${appointment.request_id}`
    );
  });
}

 function caseDocumentRecord(row) {
  return {
    id: Number(row.id),
    caseNumber: row.case_number,
    clientId: Number(row.requester_id),
    clientName: `${row.client_first_name} ${row.client_last_name}`.trim(),
    providerId: Number(row.provider_id),
    providerName: `${row.provider_first_name} ${row.provider_last_name}`.trim(),
    fileName: row.file_name,
    fileCategory: row.file_category,
    fileSize: `${Number(row.file_size || 0).toLocaleString('ar-DZ')} بايت`,
    uploadDate: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '',
    isConfidential: true,
    uploadedBy: Number(row.uploaded_by),
  };
}

async function listCaseDocuments(user) {
  const result = await pool.query(
    `SELECT DISTINCT ON (d.id) d.id, d.file_name, d.file_category, d.file_size,
            d.created_at, d.uploaded_by, cf.number_case AS case_number,
            sr.requester_id, sr.provider_id,
            cu.first_name AS client_first_name, cu.last_name AS client_last_name,
            pu.first_name AS provider_first_name, pu.last_name AS provider_last_name
       FROM case_documents d
       JOIN case_files cf ON cf.id = d.case_file_id
       JOIN service_requests sr ON sr.case_file_id = cf.id
       JOIN users cu ON cu.id = sr.requester_id
       JOIN users pu ON pu.id = sr.provider_id
      WHERE ($1::boolean OR sr.requester_id = $2 OR sr.provider_id = $2 OR sr.assigned_staff_id = $2)
        AND (d.visibility <> 'admin_only' OR $1::boolean OR d.uploaded_by = $2)
      ORDER BY d.id, d.created_at DESC`,
    [user.role_slug === 'admin', user.id]
  );
  return result.rows.map(caseDocumentRecord);
}

async function updateAvailability(body, user, req) {
  requireActive(user);
  const durationMinutes = user.role_slug === 'psychologist'
    ? 50
    : ['lawyer', 'legal_advisor'].includes(user.role_slug)
      ? 30
      : null;
  if (!durationMinutes) throw new HttpError(403, 'هذا الحساب لا يدير مواعيد الاستشارات.');
  if (!Array.isArray(body.slots) || body.slots.length > 60) {
    throw new HttpError(400, 'يمكن حفظ ما يصل إلى 60 موعدًا متاحًا.');
  }
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set();
  const slots = body.slots.map((slot) => {
    const date = String(slot.date || '');
    const time = String(slot.time || '').slice(0, 5);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today || !/^\d{2}:\d{2}$/.test(time)) {
      throw new HttpError(400, 'تحقق من تاريخ ووقت كل موعد متاح.');
    }
    const [hour, minute] = time.split(':').map(Number);
    if (hour > 23 || minute > 59 || hour * 60 + minute + durationMinutes >= 24 * 60) {
      throw new HttpError(400, 'أحد أوقات المواعيد غير صالح.');
    }
    const key = `${date}T${time}`;
    if (seen.has(key)) throw new HttpError(400, 'لا يمكن تكرار الموعد نفسه.');
    seen.add(key);
    return { date, time, durationMinutes };
  }).sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  for (let index = 1; index < slots.length; index += 1) {
    const previous = slots[index - 1];
    const current = slots[index];
    const previousEnd = Number(previous.time.slice(0, 2)) * 60 + Number(previous.time.slice(3, 5)) + durationMinutes;
    const currentStart = Number(current.time.slice(0, 2)) * 60 + Number(current.time.slice(3, 5));
    if (previous.date === current.date && previousEnd > currentStart) {
      throw new HttpError(409, 'تتداخل بعض المواعيد. اترك مدة الاستشارة كاملة بين المواعيد.');
    }
  }
  await withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE specialist_profiles
          SET availability_schedule = $2
        WHERE user_id = $1`,
      [user.id, JSON.stringify(slots)]
    );
    if (!result.rowCount) throw new HttpError(409, 'لا يوجد ملف مهني مرتبط بهذا الحساب.');
    await addAudit(client, user.id, 'AVAILABILITY_UPDATED', 'specialist_profile', user.id, `${slots.length} slots`, req);
  });
  return { availabilitySlots: slots };
}

async function uploadCaseDocument(requestId, body, user, req) {
  requireActive(user);
  const request = await findRequestForUser(requestId, user);
  if (!request) throw new HttpError(404, 'الطلب غير موجود أو لا تملك صلاحية الوصول إليه.');
  const fileName = String(body.fileName || '').trim().replace(/[\\/]/g, '_').slice(0, 180);
  const category = String(body.category || 'وثيقة شخصية');
  const mimeType = String(body.mimeType || '').toLowerCase();
  const allowedCategories = new Set(['وثيقة شخصية', 'شهادة طبية', 'تقرير طبي', 'وثيقة قضائية', 'محضر رسمي']);
  const allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  const base64 = String(body.base64 || '');
  if (!fileName || !allowedCategories.has(category) || !allowedMimeTypes.has(mimeType)) {
    throw new HttpError(400, 'اسم الملف أو تصنيفه أو نوعه غير مدعوم.');
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length > 2_800_000) {
    throw new HttpError(413, 'حجم الملف يتجاوز الحد الآمن المسموح به.');
  }
  const content = Buffer.from(base64, 'base64');
  if (!content.length || content.length > 2 * 1024 * 1024) {
    throw new HttpError(413, 'اختر ملفًا لا يتجاوز حجمه 2 ميغابايت.');
  }

  const saved = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO case_documents
         (case_file_id, uploaded_by, file_name, file_category, file_type, file_size,
          storage_path, encrypted_content, visibility, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'postgres-encrypted', $7, 'all', NOW())
       RETURNING id, file_name, file_category, file_size, created_at, uploaded_by`,
      [
        request.case_file_id,
        user.id,
        fileName,
        category,
        mimeType,
        content.length,
        encryptValue(content.toString('base64')),
      ]
    );
    const row = result.rows[0];
    await addAudit(client, user.id, 'CASE_DOCUMENT_UPLOADED', 'case_file', request.case_file_id, fileName, req);
    const otherParty = Number(user.id) === Number(request.requester_id)
      ? request.provider_id
      : request.requester_id;
    await addNotification(
      client,
      otherParty,
      'وثيقة جديدة مرتبطة بالطلب',
      'أضيفت وثيقة مشفرة إلى الطلب. افتح الطلب لمراجعتها.',
      'STATUS',
      `/requests/${request.id}`
    );
    return row;
  });
  return {
    document: caseDocumentRecord({
      ...saved,
      case_number: request.case_number,
      requester_id: request.requester_id,
      provider_id: request.provider_id,
      client_first_name: request.client_first_name,
      client_last_name: request.client_last_name,
      provider_first_name: request.provider_first_name,
      provider_last_name: request.provider_last_name,
    }),
  };
}

async function downloadCaseDocument(documentId, user) {
  const result = await pool.query(
    `SELECT d.*, sr.id AS request_id, sr.requester_id, sr.provider_id, sr.assigned_staff_id
       FROM case_documents d
       JOIN service_requests sr ON sr.case_file_id = d.case_file_id
      WHERE d.id = $1
        AND ($2::boolean OR sr.requester_id = $3 OR sr.provider_id = $3 OR sr.assigned_staff_id = $3)
        AND (d.visibility <> 'admin_only' OR $2::boolean OR d.uploaded_by = $3)
      LIMIT 1`,
    [documentId, user.role_slug === 'admin', user.id]
  );
  const document = result.rows[0];
  if (!document) throw new HttpError(404, 'الوثيقة غير موجودة أو لا تملك صلاحية الوصول إليها.');
  return {
    fileName: document.file_name,
    mimeType: document.file_type || 'application/octet-stream',
    base64: decryptValue(document.encrypted_content || ''),
  };
}

async function createReport(body, user, req) {
  requireActive(user);
  if (!providerRoles.has(user.role_slug)) throw new HttpError(403, 'كتابة التقرير مخصصة لمقدم الخدمة المعتمد.');
  const request = await findRequestForUser(body.requestId, user);
  if (!request || Number(request.provider_id) !== Number(user.id)) {
    throw new HttpError(403, 'لا يمكنك كتابة تقرير لطلب غير مسند إليك.');
  }
  const values = [
    String(body.evaluation || '').trim(),
    String(body.professionalNotes || '').trim(),
    String(body.recommendations || '').trim(),
    String(body.treatmentPlan || '').trim(),
  ];
  if (values.some((value) => value.length > 6000)) throw new HttpError(400, 'أحد حقول التقرير يتجاوز الحد المسموح.');
  if (values.every((value) => !value)) throw new HttpError(400, 'أدخل محتوى مهنيًا واحدًا على الأقل.');

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO service_reports
         (request_id, provider_id, assessment, professional_notes, recommendations,
          treatment_plan, next_appointment, client_summary, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        request.id,
        user.id,
        encryptValue(values[0]),
        encryptValue(values[1]),
        encryptValue(values[2]),
        encryptValue(values[3]),
        String(body.nextAppointment || '').slice(0, 100),
        encryptValue(String(body.clientSummary || '').trim()),
      ]
    );
    await client.query(
      `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details, created_at)
       VALUES ($1, $2, 'REPORT_CREATED', $3, $3, 'أضيف تقرير مهني مشفر.', NOW())`,
      [request.id, user.id, request.status]
    );
    await addAudit(client, user.id, 'REPORT_CREATED', 'service_request', request.id, 'أضيف تقرير مهني.', req);
    await addNotification(client, request.requester_id, 'تحديث مهني جديد', 'أضاف مقدم الخدمة تحديثًا متاحًا لحسابك.', 'STATUS', `/requests/${request.id}`);
  });
  return { ok: true };
}

async function addFollowUp(body, user, req) {
  requireActive(user);
  const request = await findRequestForUser(body.requestId, user);
  if (!request || Number(request.provider_id) !== Number(user.id)) {
    throw new HttpError(403, 'لا يمكنك تسجيل متابعة لحالة غير مسندة إليك.');
  }
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO treatment_follow_ups (case_file_id, center_id, week_number, medical_notes, status_summary, created_at)
       VALUES ($1, NULL, $2, $3, $4, NOW())`,
      [
        request.case_file_id,
        Math.max(1, Math.min(520, Number(body.weekNumber) || 1)),
        encryptValue(String(body.notes || '').slice(0, 6000)),
        String(body.progress || 'مستقر').slice(0, 120),
      ]
    );
    await addAudit(client, user.id, 'TREATMENT_FOLLOWUP_CREATED', 'service_request', request.id, 'تمت إضافة متابعة مشفرة.', req);
    await addNotification(client, request.requester_id, 'تم تحديث المتابعة', 'أضاف مقدم الخدمة تحديثًا جديدًا لحالتك.', 'STATUS', `/requests/${request.id}`);
  });
  return { ok: true };
}

async function sendMessage(conversationId, body, user, req) {
  requireActive(user);
  const content = String(body.content || '').trim();
  if (!content || content.length > 4000) throw new HttpError(400, 'اكتب رسالة بين حرف واحد و4000 حرف.');
  const participants = await pool.query(
    `SELECT cp.user_id, c.case_file_id, cf.number_case
       FROM conversation_participants cp
       JOIN conversations c ON c.id = cp.conversation_id
       JOIN case_files cf ON cf.id = c.case_file_id
      WHERE cp.conversation_id = $1`,
    [conversationId]
  );
  if (!participants.rows.some((row) => Number(row.user_id) === Number(user.id))) {
    throw new HttpError(403, 'لا تملك صلاحية الوصول إلى هذه المحادثة.');
  }
  const saved = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, content, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [conversationId, user.id, encryptValue(content)]
    );
    for (const participant of participants.rows) {
      if (Number(participant.user_id) !== Number(user.id)) {
        await addNotification(client, participant.user_id, 'رسالة جديدة', 'لديك رسالة جديدة في محادثة الحالة.', 'MESSAGE', `/messages/${conversationId}`);
      }
    }
    await addAudit(client, user.id, 'MESSAGE_SENT', 'conversation', conversationId, 'أرسل المستخدم رسالة مشفرة.', req);
    return result.rows[0].id;
  });
  return { id: Number(saved), ok: true };
}

async function recordRating(body, user, req) {
  requireActive(user);
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'التقييم يجب أن يكون من 1 إلى 5.');
  const request = await findRequestForUser(body.requestId, user);
  if (!request || Number(request.requester_id) !== Number(user.id) || request.status !== 'COMPLETED') {
    throw new HttpError(403, 'يمكن تقييم الطلب بعد اكتماله فقط.');
  }
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO ratings (case_file_id, user_id, rating, feedback, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [request.case_file_id, user.id, rating, encryptValue(String(body.feedback || '').slice(0, 2000))]
    );
    await addAudit(client, user.id, 'SERVICE_RATED', 'service_request', request.id, 'أرسل المستفيد تقييمًا.', req);
  });
}

async function changeUser(id, body, user, req) {
  requireAdmin(user);
  const result = await pool.query('SELECT id, role_slug, status FROM users WHERE id = $1', [id]);
  const target = result.rows[0];
  if (!target) throw new HttpError(404, 'الحساب غير موجود.');
  if (body.status === 'active') {
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET status = 'active', is_verified = 1, updated_at = NOW() WHERE id = $1`,
        [id]
      );
      await client.query(
        `UPDATE specialist_profiles SET verification_status = 'approved' WHERE user_id = $1`,
        [id]
      );
      await client.query(`UPDATE centers SET verification_status = 'approved' WHERE user_id = $1`, [id]);
      await client.query(`UPDATE associations SET verification_status = 'approved' WHERE user_id = $1`, [id]);
      await saveDefaultConsultationService(client, target);
      await addAudit(client, user.id, 'USER_APPROVED', 'user', id, 'تم اعتماد الحساب بعد مراجعة المستندات.', req);
      await addNotification(client, Number(id), 'تم اعتماد الحساب', 'تمت مراجعة حسابك واعتماده. يمكنك الآن استخدام الخدمات المتاحة لدورك.', 'SYSTEM', '/portal');
    });
    return;
  }
  if (body.status === 'rejected' || body.status === 'suspended' || body.status === 'inactive') {
    await withTransaction(async (client) => {
      await client.query('UPDATE users SET status = $2, is_verified = 0, updated_at = NOW() WHERE id = $1', [id, body.status]);
      await client.query(
        `UPDATE specialist_profiles SET verification_status = $2 WHERE user_id = $1`,
        [id, body.status === 'rejected' ? 'rejected' : 'pending']
      );
      await addAudit(client, user.id, 'USER_STATUS_CHANGED', 'user', id, `تم تحديث حالة الحساب إلى ${body.status}.`, req);
      await addNotification(client, Number(id), 'تحديث حالة الحساب', String(body.rejectionReason || `حالة الحساب: ${body.status}`).slice(0, 500), 'SYSTEM');
    });
    return;
  }
  const safeFields = ['phone', 'wilaya_id', 'avatar_url'];
  const fields = [];
  const params = [];
  for (const key of safeFields) {
    if (body[key] === undefined) continue;
    params.push(body[key]);
    fields.push(`${key} = $${params.length}`);
  }
  if (fields.length) {
    params.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
  }
  await addAudit(pool, user.id, 'USER_UPDATED', 'user', id, 'تم تحديث ملف الحساب.', req);
}

async function updateOwnAccountSettings(body, user, req) {
  const email = body.email === undefined ? normalizeEmail(user.email) : normalizeEmail(body.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    throw new HttpError(400, 'أدخل بريدًا إلكترونيًا صالحًا.');
  }

  const phone = String(body.phone || '').trim();
  const phoneDigits = phone.replace(/\D/g, '');
  if (!/^\+?[0-9\s().-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    throw new HttpError(400, 'أدخل رقم هاتف صالحًا يتكون من 7 إلى 15 رقمًا.');
  }

  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;
  const changingEmail = email !== normalizeEmail(user.email);
  const changingPassword = newPassword !== undefined;
  if (changingPassword && (!currentPassword || !validatePassword(newPassword))) {
    throw new HttpError(400, 'لتغيير كلمة المرور، أدخل كلمة المرور الحالية وكلمة مرور جديدة من 10 أحرف على الأقل.');
  }
  if ((changingEmail || changingPassword) && !currentPassword) {
    throw new HttpError(400, 'أدخل كلمة المرور الحالية لتغيير البريد الإلكتروني أو كلمة المرور.');
  }

  try {
    await withTransaction(async (client) => {
      const existing = await client.query('SELECT password, phone, email FROM users WHERE id = $1 FOR UPDATE', [user.id]);
      const account = existing.rows[0];
      if (!account) throw new HttpError(404, 'الحساب غير موجود.');
      if ((changingEmail || changingPassword) && !await verifyPassword(String(currentPassword), account.password)) {
        throw new HttpError(401, 'كلمة المرور الحالية غير صحيحة.');
      }

      if (changingEmail) {
        const duplicate = await client.query(
          'SELECT id FROM users WHERE lower(email) = $1 AND id <> $2 LIMIT 1',
          [email, user.id]
        );
        if (duplicate.rowCount) throw new HttpError(409, 'هذا البريد الإلكتروني مستخدم بالفعل.');
      }

      const values = [user.id, phone, email];
      let passwordSql = '';
      if (changingPassword) {
        values.push(await hashPassword(newPassword));
        passwordSql = ', password = $4';
      }
      await client.query(
        `UPDATE users SET phone = $2, email = $3${passwordSql}, updated_at = NOW() WHERE id = $1`,
        values
      );

      if (phone !== account.phone) {
        await addAudit(client, user.id, 'PHONE_UPDATED', 'user', user.id, 'تم تحديث رقم الهاتف من إعدادات الحساب.', req);
      }
      if (email !== normalizeEmail(account.email)) {
        await addAudit(client, user.id, 'EMAIL_UPDATED', 'user', user.id, 'تم تحديث البريد الإلكتروني من إعدادات الحساب.', req);
      }
      if (changingPassword) {
        await addAudit(client, user.id, 'PASSWORD_CHANGED', 'user', user.id, 'تم تغيير كلمة المرور من إعدادات الحساب.', req);
      }
    });
  } catch (error) {
    if (error?.code === '23505') {
      throw new HttpError(409, 'هذا البريد الإلكتروني مستخدم بالفعل.');
    }
    throw error;
  }

  const updated = await getUserProfile(user.id);
  return safeUser(updated);
}

function parseLegalReferences(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new HttpError(500, 'تعذر قراءة المراجع القانونية المحفوظة.');
  }
  if (!Array.isArray(parsed)) throw new HttpError(500, 'تنسيق المراجع القانونية المحفوظة غير صالح.');
  return parsed;
}

async function getLegalReferences() {
  const result = await pool.query(
    `SELECT value, updated_at FROM system_settings WHERE key = 'legal_references' LIMIT 1`
  );
  const legalReferences = result.rows[0]
    ? parseLegalReferences(result.rows[0].value)
    : defaultLegalReferences;
  const uploadedFiles = await pool.query(
    `SELECT key FROM system_settings WHERE left(key, length($1)) = $1`,
    [legalReferencePdfKeyPrefix]
  );
  const uploadedFileKeys = new Set(uploadedFiles.rows.map((row) => row.key));
  return {
    legalReferences: legalReferences.map((reference) => {
      const { pdfUrl, pdfFileName, ...savedReference } = reference;
      if (!uploadedFileKeys.has(`${legalReferencePdfKeyPrefix}${reference.id}`)) {
        return savedReference;
      }
      return {
        ...savedReference,
        ...(pdfFileName ? { pdfFileName } : {}),
        pdfUrl: `/api/v1/public/legal-references/document?id=${encodeURIComponent(reference.id)}`,
      };
    }),
    updatedAt: result.rows[0]?.updated_at
      ? new Date(result.rows[0].updated_at).toISOString()
      : null,
  };
}

async function saveLegalReferencePdf(body, user, req) {
  const id = String(body.id || '').trim();
  const rawFileName = String(body.fileName || '');
  const fileName = rawFileName
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 255);
  const base64 = String(body.base64 || '');

  if (!id || id.length > 80 || !fileName.toLowerCase().endsWith('.pdf')) {
    throw new HttpError(400, 'اختر مرجعًا قانونيًا وملف PDF صالحًا.');
  }
  if (!base64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new HttpError(400, 'محتوى ملف PDF غير صالح.');
  }

  const pdfBytes = Buffer.from(base64, 'base64');
  if (
    !pdfBytes.length ||
    pdfBytes.length > legalReferencePdfMaxBytes ||
    pdfBytes.toString('ascii', 0, 5) !== '%PDF-'
  ) {
    throw new HttpError(400, 'يجب أن يكون الملف PDF صالحًا وألا يتجاوز حجمه 5 ميغابايت.');
  }

  const updatedAt = await withTransaction(async (client) => {
    const referenceSetting = await client.query(
      `SELECT value FROM system_settings WHERE key = 'legal_references' FOR UPDATE`
    );
    const currentReferences = referenceSetting.rows[0]
      ? parseLegalReferences(referenceSetting.rows[0].value)
      : defaultLegalReferences;
    if (!currentReferences.some((reference) => reference.id === id)) {
      throw new HttpError(404, 'المرجع القانوني غير موجود. احفظه أولًا ثم أرفق ملفه.');
    }

    const legalReferences = currentReferences.map((reference) =>
      reference.id === id ? { ...reference, pdfFileName: fileName } : reference
    );
    const savedReferences = await client.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('legal_references', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING updated_at`,
      [JSON.stringify(legalReferences)]
    );
    await client.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [
        `${legalReferencePdfKeyPrefix}${id}`,
        JSON.stringify({ fileName, base64, sizeBytes: pdfBytes.length }),
      ]
    );
    await addAudit(
      client,
      user.id,
      'LEGAL_REFERENCE_PDF_UPDATED',
      'system_setting',
      `${legalReferencePdfKeyPrefix}${id}`,
      `تم رفع أو استبدال ملف المرجع القانوني «${id}».`,
      req
    );
    return savedReferences.rows[0].updated_at;
  });

  const result = await getLegalReferences();
  return {
    ...result,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : result.updatedAt,
  };
}

async function serveLegalReferencePdf(id, res) {
  if (!id) throw new HttpError(400, 'حدد المرجع القانوني المطلوب.');
  const references = await getLegalReferences();
  if (!references.legalReferences.some((reference) => reference.id === id && reference.pdfUrl)) {
    throw new HttpError(404, 'لا يوجد ملف PDF محفوظ لهذا المرجع القانوني.');
  }

  const result = await pool.query(
    'SELECT value FROM system_settings WHERE key = $1 LIMIT 1',
    [`${legalReferencePdfKeyPrefix}${id}`]
  );
  if (!result.rows[0]) throw new HttpError(404, 'ملف المرجع القانوني غير موجود.');

  let document;
  try {
    document = JSON.parse(result.rows[0].value);
  } catch {
    throw new HttpError(500, 'تعذر قراءة ملف المرجع القانوني المحفوظ.');
  }
  const pdfBytes = Buffer.from(String(document.base64 || ''), 'base64');
  if (!pdfBytes.length || pdfBytes.toString('ascii', 0, 5) !== '%PDF-') {
    throw new HttpError(500, 'ملف المرجع القانوني المحفوظ غير صالح.');
  }

  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="legal-document.pdf"; filename*=UTF-8''${encodeURIComponent(document.fileName || 'legal-document.pdf')}`,
    'Content-Length': pdfBytes.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  return res.end(pdfBytes);
}

async function saveLegalReferences(body, user, req) {
  if (!Array.isArray(body.legalReferences) || body.legalReferences.length > 50) {
    throw new HttpError(400, 'قائمة القوانين غير صالحة أو تجاوزت الحد المسموح.');
  }

  const ids = new Set();
  const legalReferences = body.legalReferences.map((entry) => {
    const id = String(entry?.id || '').trim().slice(0, 80);
    const title = String(entry?.title || '').trim();
    const ref = String(entry?.ref || '').trim();
    const summary = String(entry?.summary || '').trim();
    const pdfFileName = String(entry?.pdfFileName || '').trim().slice(0, 255);
    if (!id || ids.has(id) || !title || !ref || !summary) {
      throw new HttpError(400, 'تأكد من إدخال عنوان ومرجع وملخص فريد لكل قانون.');
    }
    if (title.length > 250 || ref.length > 250 || summary.length > 5000) {
      throw new HttpError(400, 'تجاوز أحد حقول القانون الحد الأقصى المسموح.');
    }
    ids.add(id);
    return { id, title, ref, summary, ...(pdfFileName ? { pdfFileName } : {}) };
  });

  const updatedAt = await withTransaction(async (client) => {
    const saved = await client.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('legal_references', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING updated_at`,
      [JSON.stringify(legalReferences)]
    );
    const storedFiles = await client.query(
      `SELECT key FROM system_settings WHERE left(key, length($1)) = $1`,
      [legalReferencePdfKeyPrefix]
    );
    for (const storedFile of storedFiles.rows) {
      const fileId = storedFile.key.slice(legalReferencePdfKeyPrefix.length);
      if (!ids.has(fileId)) {
        await client.query('DELETE FROM system_settings WHERE key = $1', [storedFile.key]);
      }
    }
    await addAudit(
      client,
      user.id,
      'LEGAL_REFERENCES_UPDATED',
      'system_setting',
      'legal_references',
      `تم تحديث ${legalReferences.length} مرجعًا قانونيًا.`,
      req
    );
    return saved.rows[0].updated_at;
  });
  const savedReferences = await getLegalReferences();
  return {
    ...savedReferences,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : savedReferences.updatedAt,
  };
}

async function adminUsersCreate(body, user, req) {
  requireAdmin(user);
  const row = await createUser(body, user, req, false);
  return safeUser(row);
}

async function getPublicDirectory(url) {
  const type = url.searchParams.get('type');
  if (!['centers', 'associations'].includes(type)) throw new HttpError(400, 'نوع الدليل غير صالح.');
  const table = type === 'centers' ? 'centers' : 'associations';
  const rows = await pool.query(
    `SELECT r.id, r.name, r.address, r.phone, r.services, w.name_ar AS wilaya_name
       FROM ${table} r LEFT JOIN wilayas w ON w.id = r.wilaya_id
      WHERE r.verification_status = 'approved' ORDER BY w.code, r.name`
  );
  return rows.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    wilayaName: row.wilaya_name || '',
    address: row.address || '',
    phone: row.phone || '',
    services: row.services || '',
  }));
}

async function getPublicServices() {
  const result = await pool.query(
    `SELECT s.id, s.title, s.description, s.amount_dzd, s.category, s.provider_id,
            u.first_name AS provider_first_name, u.last_name AS provider_last_name
       FROM services s
       JOIN users u ON u.id = s.provider_id
       LEFT JOIN specialist_profiles sp ON sp.user_id = u.id
       LEFT JOIN centers c ON c.user_id = u.id
       LEFT JOIN associations a ON a.user_id = u.id
      WHERE s.is_active = 1 AND u.status = 'active' AND COALESCE(u.is_verified, 0) = 1
        AND s.category IN ('legal', 'psychological') AND s.amount_dzd = 500
        AND COALESCE(sp.verification_status, c.verification_status, a.verification_status, 'approved') = 'approved'
      ORDER BY s.category, s.title`
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    category: row.category,
    description: row.description,
    amountDzd: Number(row.amount_dzd),
    providerId: Number(row.provider_id),
    providerName: `${row.provider_first_name} ${row.provider_last_name}`.trim(),
  }));
}

async function getPartners() {
  const result = await pool.query(`SELECT value FROM system_settings WHERE key = 'public_partners' LIMIT 1`);
  if (!result.rows[0]) return [];
  try {
    const parsed = JSON.parse(result.rows[0].value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePartners(partners) {
  await pool.query(
    `INSERT INTO system_settings (key, value) VALUES ('public_partners', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(partners)]
  );
}

export async function dispatchApi(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [process.env.FRONTEND_URL, process.env.PUBLIC_BACKEND_URL]
    .filter(Boolean)
    .map((value) => {
      try { return new URL(value).origin; } catch { return ''; }
    });
  const requestOrigin = origin || '';
  const sameHost = requestOrigin && new URL(requestOrigin).host === (req.headers.host || '');

  if (origin && (allowedOrigins.includes(requestOrigin) || sameHost)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  } else if (origin) {
    throw new HttpError(403, 'مصدر الطلب غير مسموح.');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
    });
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method || 'GET';

  if (method === 'GET' && pathname === '/api/v1/health') {
    await pool.query('SELECT 1');
    return json(res, 200, { ok: true });
  }
  if (method === 'GET' && pathname === '/api/v1/public/directory') {
    return json(res, 200, await getPublicDirectory(url));
  }
  if (method === 'GET' && pathname === '/api/v1/public/services') {
    return json(res, 200, await getPublicServices());
  }
  if (method === 'GET' && pathname === '/api/v1/public/legal-references') {
    return json(res, 200, await getLegalReferences());
  }
  if (method === 'GET' && pathname === '/api/v1/public/legal-references/document') {
    return serveLegalReferencePdf(url.searchParams.get('id'), res);
  }
  if (method === 'PATCH' && pathname === '/api/v1/profile/availability') {
    return json(res, 200, await updateAvailability(await bodyJson(req), user, req));
  }
  if (method === 'POST' && pathname === '/api/v1/payments/webhook') {
    const bytes = await rawBody(req, 256 * 1024);
    await handleChargilyWebhook(bytes, String(req.headers.signature || ''));
    return json(res, 200, { received: true });
  }
  if (method === 'POST' && pathname === '/api/v1/auth/login') {
    const body = await bodyJson(req);
    const email = normalizeEmail(body.email);
    const attemptsKey = `${clientIp(req)}:${email}`;
    const now = Date.now();
    globalThis.loginAttempts ||= new Map();
    const attempt = globalThis.loginAttempts.get(attemptsKey) || { count: 0, started: now };
    if (now - attempt.started > 15 * 60 * 1000) {
      attempt.count = 0;
      attempt.started = now;
    }
    if (attempt.count >= 10) throw new HttpError(429, 'تم تجاوز عدد محاولات الدخول. حاول لاحقًا.');
    const result = await pool.query('SELECT * FROM users WHERE lower(email) = $1 LIMIT 1', [email]);
    const userRow = result.rows[0];
    if (!userRow || !await verifyPassword(String(body.password || ''), userRow.password)) {
      attempt.count += 1;
      globalThis.loginAttempts.set(attemptsKey, attempt);
      throw new HttpError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
    if (['suspended', 'inactive', 'rejected'].includes(userRow.status)) {
      throw new HttpError(403, 'هذا الحساب غير نشط. تواصل مع الإدارة لمعرفة التفاصيل.');
    }
    globalThis.loginAttempts.delete(attemptsKey);
    const profile = await getUserProfile(userRow.id);
    await addAudit(pool, userRow.id, 'LOGIN_SUCCESS', 'user', userRow.id, 'تم تسجيل الدخول بنجاح.', req);
    const rememberMe = body.rememberMe === true;
    return json(
      res,
      200,
      { user: safeUser(profile) },
      { 'Set-Cookie': sessionCookie(createSessionToken(userRow, rememberMe), rememberMe) }
    );
  }
  if (method === 'POST' && pathname === '/api/v1/auth/register') {
    const body = await bodyJson(req);
    const row = await createUser(body, null, req, true);
    const token = createSessionToken(row);
    return json(res, 201, { user: safeUser(row) }, { 'Set-Cookie': sessionCookie(token) });
  }
  if (method === 'POST' && pathname === '/api/v1/auth/logout') {
    return json(res, 200, { ok: true }, { 'Set-Cookie': clearCookieHeader(COOKIE_NAME) });
  }
  if (method === 'GET' && pathname === '/api/v1/auth/me') {
    const user = await currentUser(req);
    return json(res, 200, { user: user ? safeUser(user) : null });
  }
  if (method === 'POST' && pathname === '/api/v1/auth/password-reset') {
    await bodyJson(req);
    throw new HttpError(503, 'استعادة كلمة المرور بالبريد غير مهيأة بعد. لم يتم إنشاء رمز غير آمن أو عرضه في الصفحة.');
  }
  if (method === 'GET' && pathname === '/api/v1/bootstrap') {
    const user = await requireUser(req);
    return json(res, 200, await loadBootstrap(user));
  }

  const user = await requireUser(req);
  const userRoute = pathname.match(/^\/api\/v1\/users\/(\d+)$/);
  const requestRoute = pathname.match(/^\/api\/v1\/requests\/(\d+)$/);
  const paymentRoute = pathname.match(/^\/api\/v1\/requests\/(\d+)\/payment$/);
  const requestDocumentsRoute = pathname.match(/^\/api\/v1\/requests\/(\d+)\/documents$/);
  const documentRoute = pathname.match(/^\/api\/v1\/documents\/(\d+)$/);
  const appointmentRoute = pathname.match(/^\/api\/v1\/appointments\/(\d+)$/);
  const conversationRoute = pathname.match(/^\/api\/v1\/conversations\/(\d+)\/messages$/);
  const notificationRoute = pathname.match(/^\/api\/v1\/notifications\/(\d+)\/read$/);

  if (method === 'PATCH' && pathname === '/api/v1/profile/settings') {
    const updatedUser = await updateOwnAccountSettings(await bodyJson(req), user, req);
    return json(res, 200, { user: updatedUser });
  }
  if (method === 'POST' && pathname === '/api/v1/admin/legal-references/document') {
    requireAdmin(user);
    const result = await saveLegalReferencePdf(await bodyJson(req, 8 * 1024 * 1024), user, req);
    return json(res, 200, result);
  }
  if (method === 'PATCH' && pathname === '/api/v1/admin/legal-references') {
    requireAdmin(user);
    return json(res, 200, await saveLegalReferences(await bodyJson(req), user, req));
  }

  if (method === 'POST' && pathname === '/api/v1/users') {
    const created = await adminUsersCreate(await bodyJson(req), user, req);
    return json(res, 201, { user: created });
  }
  if (method === 'PATCH' && userRoute) {
    const body = await bodyJson(req);
    await changeUser(Number(userRoute[1]), body, user, req);
    return json(res, 200, { ok: true });
  }
  if (method === 'DELETE' && userRoute) {
    requireAdmin(user);
    if (Number(userRoute[1]) === Number(user.id)) throw new HttpError(409, 'لا يمكن تعطيل الحساب الإداري المستخدم حاليًا.');
    await changeUser(Number(userRoute[1]), { status: 'suspended' }, user, req);
    return json(res, 200, { ok: true, suspended: true });
  }
  if (method === 'POST' && pathname === '/api/v1/requests') {
    const result = await createRequest(await bodyJson(req), user, req);
    return json(res, 201, result);
  }
  if (method === 'GET' && pathname === '/api/v1/documents') {
    return json(res, 200, await listCaseDocuments(user));
  }
  if (method === 'POST' && requestDocumentsRoute) {
    const result = await uploadCaseDocument(
      Number(requestDocumentsRoute[1]),
      await bodyJson(req, 4 * 1024 * 1024),
      user,
      req
    );
    return json(res, 201, result);
  }
  if (method === 'GET' && documentRoute) {
    return json(res, 200, await downloadCaseDocument(Number(documentRoute[1]), user));
  }
  if (method === 'PATCH' && requestRoute) {
    await updateRequest(Number(requestRoute[1]), await bodyJson(req), user, req);
    return json(res, 200, { ok: true });
  }
  if (method === 'POST' && paymentRoute) {
    const body = await bodyJson(req);
    const result = await createChargilyCheckout(Number(paymentRoute[1]), user, body.method);
    return json(res, 200, result);
  }
  if (method === 'PATCH' && appointmentRoute) {
    const body = await bodyJson(req);
    await setAppointmentStatus(Number(appointmentRoute[1]), body.status, user, req);
    return json(res, 200, { ok: true });
  }
  if (method === 'POST' && pathname === '/api/v1/reports') {
    await createReport(await bodyJson(req), user, req);
    return json(res, 201, { ok: true });
  }
  if (method === 'POST' && pathname === '/api/v1/follow-ups') {
    await addFollowUp(await bodyJson(req), user, req);
    return json(res, 201, { ok: true });
  }
  if (method === 'POST' && conversationRoute) {
    const result = await sendMessage(Number(conversationRoute[1]), await bodyJson(req), user, req);
    return json(res, 201, result);
  }
  if (method === 'POST' && pathname === '/api/v1/ratings') {
    await recordRating(await bodyJson(req), user, req);
    return json(res, 201, { ok: true });
  }
  if (method === 'POST' && notificationRoute) {
    const result = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2',
      [Number(notificationRoute[1]), user.id]
    );
    if (!result.rowCount) throw new HttpError(404, 'الإشعار غير موجود.');
    return json(res, 200, { ok: true });
  }
  if (method === 'POST' && pathname === '/api/v1/privacy/consent') {
    requireActive(user);
    const body = await bodyJson(req);
    if (body.accepted !== true) throw new HttpError(400, 'يجب تحديد الموافقة صراحةً.');
    await addAudit(pool, user.id, 'PRIVACY_CONSENT_GIVEN', 'user', user.id, 'موافقة معالجة بيانات الخدمة؛ الإصدار 1.', req);
    return json(res, 200, { ok: true });
  }
  if (method === 'GET' && pathname === '/api/v1/partners') {
    return json(res, 200, await getPartners());
  }
  if (method === 'POST' && pathname === '/api/v1/partners') {
    requireAdmin(user);
    const body = await bodyJson(req);
    const partners = await getPartners();
    const entry = {
      id: crypto.randomUUID(),
      name: String(body.name || '').trim().slice(0, 150),
      category: body.category,
      websiteUrl: String(body.websiteUrl || '').trim().slice(0, 300),
      description: String(body.description || '').trim().slice(0, 1000),
      isVisible: body.isVisible !== false,
    };
    if (!entry.name) throw new HttpError(400, 'اسم الجهة مطلوب.');
    if (entry.websiteUrl && !/^https:\/\//i.test(entry.websiteUrl)) throw new HttpError(400, 'يجب أن يبدأ رابط الجهة بـ HTTPS.');
    partners.push(entry);
    await savePartners(partners);
    await addAudit(pool, user.id, 'PARTNER_CREATED', 'partner', entry.id, entry.name, req);
    return json(res, 201, entry);
  }
  const partnerRoute = pathname.match(/^\/api\/v1\/partners\/([^/]+)$/);
  if (partnerRoute && ['PATCH', 'DELETE'].includes(method)) {
    requireAdmin(user);
    const partners = await getPartners();
    const index = partners.findIndex((partner) => String(partner.id) === decodeURIComponent(partnerRoute[1]));
    if (index < 0) throw new HttpError(404, 'الجهة غير موجودة.');
    if (method === 'DELETE') {
      partners.splice(index, 1);
    } else {
      const body = await bodyJson(req);
      partners[index] = {
        ...partners[index],
        ...Object.fromEntries(
          ['name', 'category', 'websiteUrl', 'description', 'isVisible'].filter((key) => body[key] !== undefined).map((key) => [key, body[key]])
        ),
      };
    }
    await savePartners(partners);
    await addAudit(pool, user.id, method === 'DELETE' ? 'PARTNER_DELETED' : 'PARTNER_UPDATED', 'partner', partnerRoute[1], null, req);
    return json(res, 200, { ok: true });
  }

  throw new HttpError(404, 'المسار المطلوب غير موجود.');
}
