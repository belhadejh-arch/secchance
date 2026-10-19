import crypto from 'node:crypto';
import { pool, withTransaction } from './db.js';
import { HttpError, encryptValue } from './security.js';
import { findRequestForUser } from './data.js';
import { demoPaymentsEnabled } from './paymentMode.js';

function publicUrl(base, path) {
  if (!base || !/^https:\/\//i.test(base)) {
    throw new HttpError(503, 'رابط الخادم العام الآمن غير مضبوط لاستقبال تأكيدات الدفع.');
  }
  return `${base.replace(/\/+$/, '')}${path}`;
}

function verifySignature(rawBody, signature, secret) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(expected, supplied);
}

async function notify(userId, title, message, type, link) {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, 0, NOW())`,
    [userId, title, message, type, link]
  );
}

function chargilyMode() {
  return process.env.CHARGILY_MODE === 'live' ? 'live' : 'test';
}

function chargilySecret(mode = chargilyMode()) {
  return mode === 'live'
    ? process.env.CHARGILY_LIVE_SECRET_KEY
    : process.env.CHARGILY_SECRET_KEY;
}

export async function createChargilyCheckout(requestId, user, method) {
  if (demoPaymentsEnabled()) {
    throw new HttpError(409, 'المنصة في وضع الدفع التجريبي. استخدم زر الدفع التجريبي لتأكيد الموعد.');
  }
  const mode = chargilyMode();
  const secret = chargilySecret(mode);
  if (!secret) {
    throw new HttpError(503, 'بوابة الدفع غير مهيأة بعد؛ لم يتم تحصيل أي مبلغ.');
  }
  if (!['EDAHABIA', 'CIB'].includes(method)) {
    throw new HttpError(400, 'طريقة الدفع المحددة غير مدعومة.');
  }

  const request = await findRequestForUser(requestId, user);
  if (!request || Number(request.requester_id) !== Number(user.id)) {
    throw new HttpError(404, 'الطلب غير موجود أو لا تملك صلاحية الدفع عنه.');
  }
  if (!['ACCEPTED', 'WAITING_PAYMENT'].includes(request.status)) {
    throw new HttpError(409, 'لا يمكن الدفع قبل موافقة مقدم الخدمة.');
  }
  if (
    !Number.isSafeInteger(Number(request.amount_dzd)) ||
    Number(request.amount_dzd) <= 0 ||
    !['legal', 'psychological'].includes(request.category)
  ) {
    throw new HttpError(409, 'لا يمكن الدفع لأن مبلغ الخدمة غير صالح.');
  }
  if (request.payment_status === 'PAID') {
    throw new HttpError(409, 'تم تأكيد دفع هذا الطلب مسبقًا.');
  }

  const existing = await pool.query(
    `SELECT id, checkout_url FROM payments
      WHERE request_id = $1 AND status IN ('PENDING', 'PROCESSING')
        AND gateway_checkout_id IS NOT NULL
      ORDER BY created_at DESC LIMIT 1`,
    [requestId]
  );
  if (existing.rows[0]?.checkout_url) {
    return { checkoutUrl: existing.rows[0].checkout_url };
  }

  const payment = await withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [Number(user.id), Number(requestId)]);
    const repeated = await client.query(
      `SELECT id, checkout_url FROM payments
        WHERE request_id = $1 AND status IN ('PENDING', 'PROCESSING')
          AND gateway_checkout_id IS NOT NULL
        ORDER BY created_at DESC LIMIT 1`,
      [requestId]
    );
    if (repeated.rows[0]?.checkout_url) return repeated.rows[0];

    const inserted = await client.query(
      `INSERT INTO payments (request_id, user_id, provider_id, amount_dzd, currency,
                             payment_method, status, created_at)
       VALUES ($1, $2, $3, $4, 'DZD', $5, 'PROCESSING', NOW())
       RETURNING id`,
      [requestId, user.id, request.provider_id, request.amount_dzd, method.toLowerCase()]
    );
    await client.query(
      `UPDATE service_requests SET payment_status = 'PROCESSING', updated_at = NOW()
        WHERE id = $1`,
      [requestId]
    );
    await client.query(
      `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details, created_at)
       VALUES ($1, $2, 'PAYMENT_STARTED', $3, $3, 'بدأ العميل الدفع عبر بوابة Chargily المستضافة.', NOW())`,
      [requestId, user.id, request.status]
    );
    return { id: inserted.rows[0].id };
  });

  if (payment.checkout_url) return { checkoutUrl: payment.checkout_url };

  const apiUrl = mode === 'live'
    ? 'https://pay.chargily.net/api/v2/checkouts'
    : 'https://pay.chargily.net/test/api/v2/checkouts';
  const frontend = process.env.FRONTEND_URL;
  const backend = process.env.PUBLIC_BACKEND_URL;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        amount: Number(request.amount_dzd),
        currency: 'dzd',
        payment_method: method === 'EDAHABIA' ? 'edahabia' : 'cib',
        locale: 'ar',
        description: request.service_title,
        success_url: `${publicUrl(frontend, '')}?payment=success&request=${encodeURIComponent(requestId)}`,
        failure_url: `${publicUrl(frontend, '')}?payment=failure&request=${encodeURIComponent(requestId)}`,
        webhook_endpoint: publicUrl(backend, '/api/v1/payments/webhook'),
        metadata: [{ payment_id: String(payment.id), request_id: String(requestId) }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const checkout = await response.json().catch(() => ({}));
    if (!response.ok || !checkout.id || !checkout.checkout_url) {
      await pool.query(
        `UPDATE payments SET status = 'FAILED' WHERE id = $1 AND status = 'PROCESSING'`,
        [payment.id]
      );
      await pool.query(
        `UPDATE service_requests SET payment_status = 'FAILED', updated_at = NOW()
          WHERE id = $1`,
        [requestId]
      );
      throw new HttpError(502, 'تعذر إنشاء جلسة الدفع لدى Chargily. لم يُسجل أي دفع ناجح.');
    }

    await pool.query(
      `UPDATE payments SET gateway_checkout_id = $2, checkout_url = $3
        WHERE id = $1`,
      [payment.id, checkout.id, checkout.checkout_url]
    );
    return { checkoutUrl: checkout.checkout_url };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    await pool.query(
      `UPDATE payments SET status = 'FAILED' WHERE id = $1 AND status = 'PROCESSING'`,
      [payment.id]
    );
    await pool.query(
      `UPDATE service_requests SET payment_status = 'FAILED', updated_at = NOW()
        WHERE id = $1`,
      [requestId]
    );
    throw new HttpError(502, 'تعذر الاتصال ببوابة الدفع. لم يُسجل أي دفع ناجح.');
  }
}

export async function handleChargilyWebhook(rawBody, signature) {
  const mode = chargilyMode();
  const secret = chargilySecret(mode);
  if (!secret) throw new HttpError(503, 'بوابة الدفع غير مهيأة.');
  if (!verifySignature(rawBody, signature, secret)) {
    throw new HttpError(403, 'توقيع إشعار الدفع غير صالح.');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new HttpError(400, 'صيغة إشعار الدفع غير صالحة.');
  }

  const checkout = event?.data;
  if (!event?.id || !event?.type || !checkout?.id) {
    throw new HttpError(400, 'بيانات إشعار الدفع غير مكتملة.');
  }

  await withTransaction(async (client) => {
    const paymentResult = await client.query(
      `SELECT p.*, sr.id AS request_id, sr.case_file_id, sr.requester_id,
              sr.provider_id, sr.status AS request_status, sr.payment_status,
              sr.service_id, s.category, cf.number_case AS case_number
         FROM payments p
         JOIN service_requests sr ON sr.id = p.request_id
         JOIN case_files cf ON cf.id = sr.case_file_id
         JOIN services s ON s.id = sr.service_id
        WHERE p.gateway_checkout_id = $1
        FOR UPDATE OF p, sr`,
      [checkout.id]
    );
    const payment = paymentResult.rows[0];
    if (!payment) throw new HttpError(404, 'لا يوجد دفع مسجل لجلسة Chargily هذه.');

    const statusByEvent = {
      'checkout.paid': 'PAID',
      'checkout.failed': 'FAILED',
      'checkout.canceled': 'CANCELLED',
      'checkout.cancelled': 'CANCELLED',
    };
    const paymentStatus = statusByEvent[event.type];
    if (!paymentStatus) return;

    if (event.type === 'checkout.paid') {
      if (
        Number(checkout.amount) !== Number(payment.amount_dzd) ||
        String(checkout.currency).toUpperCase() !== 'DZD' ||
        !['legal', 'psychological'].includes(payment.category)
      ) {
        throw new HttpError(409, 'بيانات المبلغ أو العملة لا تطابق الطلب.');
      }
      const expectedLive = mode === 'live';
      const actualLive = checkout.livemode === true || checkout.livemode === 'true';
      if (expectedLive !== actualLive) {
        throw new HttpError(409, 'بيئة الدفع لا تطابق إعداد المنصة.');
      }
    }

    const alreadyRecorded = await client.query(
      `SELECT id FROM payment_transactions WHERE event_id = $1`,
      [String(event.id)]
    );
    if (alreadyRecorded.rowCount) return;

    await client.query(
      `UPDATE payments
          SET status = $2, transaction_id = $3, paid_at = CASE WHEN $2 = 'PAID' THEN NOW() ELSE paid_at END
        WHERE id = $1`,
      [payment.id, paymentStatus, String(checkout.id)]
    );
    await client.query(
      `INSERT INTO payment_transactions
         (payment_id, gateway, gateway_transaction_id, gateway_checkout_id,
          amount_dzd, currency, status, event_id, payload, created_at)
       VALUES ($1, 'chargily', $2, $3, $4, 'DZD', $5, $6, $7, NOW())`,
      [
        payment.id,
        String(checkout.id),
        String(checkout.id),
        Number(payment.amount_dzd),
        paymentStatus,
        String(event.id),
        encryptValue(rawBody),
      ]
    );

    const fromStatus = payment.request_status;
    if (paymentStatus === 'PAID') {
      await client.query(
        `UPDATE service_requests
            SET status = 'APPOINTMENT_CONFIRMED', payment_status = 'PAID', updated_at = NOW()
          WHERE id = $1`,
        [payment.request_id]
      );
      await client.query(
        `UPDATE case_files SET status = 'ASSIGNED', updated_at = NOW() WHERE id = $1`,
        [payment.case_file_id]
      );
      await client.query(
        `UPDATE appointments SET status = 'CONFIRMED'
          WHERE id = (SELECT appointment_id FROM service_requests WHERE id = $1)`,
        [payment.request_id]
      );
      await client.query(
        `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details, created_at)
         VALUES ($1, NULL, 'PAYMENT_CONFIRMED', $2, 'APPOINTMENT_CONFIRMED',
                 'تم التحقق من الدفع عبر توقيع Chargily ومطابقة المبلغ والعملة.', NOW())`,
        [payment.request_id, fromStatus]
      );
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
         VALUES
           ($1, 'تم تأكيد الدفع والموعد', 'تم تأكيد الدفع وحجز الموعد. يمكنك مراجعة تفاصيل الطلب.', 'PAYMENT', $3, 0, NOW()),
           ($2, 'تم تأكيد دفع طلب', 'أكدت بوابة الدفع المبلغ المستحق لطلبك.', 'PAYMENT', $3, 0, NOW())`,
        [payment.requester_id, payment.provider_id, `/requests/${payment.request_id}`]
      );
    } else {
      await client.query(
        `UPDATE service_requests SET payment_status = $2, updated_at = NOW() WHERE id = $1`,
        [payment.request_id, paymentStatus]
      );
      await client.query(
        `INSERT INTO request_history (request_id, user_id, action, from_status, to_status, details, created_at)
         VALUES ($1, NULL, 'PAYMENT_STATUS_CHANGED', $2, $2, $3, NOW())`,
        [payment.request_id, fromStatus, `حالة الدفع: ${paymentStatus}`]
      );
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
         VALUES ($1, 'تعذر تأكيد الدفع', 'لم تؤكد البوابة نجاح الدفع. يمكنك إعادة المحاولة من طلباتك.', 'PAYMENT', $2, 0, NOW())`,
        [payment.requester_id, `/requests/${payment.request_id}`]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES (NULL, 'PAYMENT_WEBHOOK_VERIFIED', 'payment', $1, $2, NULL, NOW())`,
      [String(payment.id), `تمت معالجة إشعار ${event.type} بعد التحقق من التوقيع.`]
    );
  });
}
