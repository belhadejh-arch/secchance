import { pool, withTransaction } from './db.js';
import { demoPaymentsEnabled } from './paymentMode.js';

// Demo bookings belong to the administration, never to a fictional clinician.
export async function ensureDemoServices() {
  if (!demoPaymentsEnabled()) return;
  await withTransaction(async (client) => {
    // Serialize initializers so this remains idempotent even on older schemas
    // that do not yet have UNIQUE(provider_id, category).
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [628374, 1]);
    const admin = await client.query(
      `SELECT id FROM users
        WHERE role_slug = 'admin' AND status = 'active'
        ORDER BY id LIMIT 1`
    );
    if (!admin.rowCount) return;

    const providerId = admin.rows[0].id;
    const demoServices = [
      ['legal', 'حجز استشارة قانونية — تجريبي'],
      ['psychological', 'حجز استشارة نفسية — تجريبي'],
    ];

    for (const [category, title] of demoServices) {
      const updated = await client.query(
        `UPDATE services
            SET title = $3,
                description = 'حجز تجريبي فقط لا يتضمن استشارة فعلية أو تعيين مختص ولا يخصم أموالًا.',
                amount_dzd = 500,
                is_active = 1,
                updated_at = NOW()
          WHERE provider_id = $1 AND category = $2`,
        [providerId, category, title]
      );
      if (updated.rowCount === 0) {
        await client.query(
          `INSERT INTO services (provider_id, title, description, amount_dzd, category, is_active)
           VALUES ($1, $2, 'حجز تجريبي فقط لا يتضمن استشارة فعلية أو تعيين مختص ولا يخصم أموالًا.', 500, $3, 1)`,
          [providerId, title, category]
        );
      }
    }
  });
}
