import { pool } from './db.js';
import { demoPaymentsEnabled } from './paymentMode.js';

// Demo bookings belong to the administration, never to a fictional clinician.
export async function ensureDemoServices() {
  if (!demoPaymentsEnabled()) return;
  await pool.query(
    `INSERT INTO services (provider_id, title, description, amount_dzd, category, is_active)
     SELECT u.id, v.title, 'حجز تجريبي فقط لا يتضمن استشارة فعلية أو تعيين مختص ولا يخصم أموالًا.',
            500, v.category, 1
       FROM (SELECT id FROM users WHERE role_slug = 'admin' AND status = 'active' ORDER BY id LIMIT 1) u
       CROSS JOIN (VALUES ('legal', 'حجز استشارة قانونية — تجريبي'),
                          ('psychological', 'حجز استشارة نفسية — تجريبي')) v(category, title)
     ON CONFLICT (provider_id, category) DO UPDATE SET is_active = 1`
  );
}
