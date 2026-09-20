import { Router, Response } from 'express';
import { query } from '../db';

const router = Router();

// Wilayas
router.get('/wilayas', (req, res: Response) => {
  const wilayas = query('SELECT * FROM wilayas ORDER BY code ASC');
  res.json({ success: true, data: wilayas });
});

// Addiction Types
router.get('/addiction-types', (req, res: Response) => {
  const types = query('SELECT * FROM addiction_types WHERE is_active = 1 ORDER BY id ASC');
  res.json({ success: true, data: types });
});

// Emergency Resources & Hotlines
router.get('/emergency-resources', (req, res: Response) => {
  const emergencies = query('SELECT * FROM emergency_resources');
  res.json({ success: true, data: emergencies });
});

// Verified Treatment Centers
router.get('/centers', (req, res: Response) => {
  const centers = query(`
    SELECT c.*, w.name_ar as wilaya_name
    FROM centers c
    JOIN wilayas w ON c.wilaya_id = w.id
    WHERE c.verification_status = 'approved'
  `);
  res.json({ success: true, data: centers });
});

// Verified Associations
router.get('/associations', (req, res: Response) => {
  const associations = query(`
    SELECT a.*, w.name_ar as wilaya_name
    FROM associations a
    JOIN wilayas w ON a.wilaya_id = w.id
    WHERE a.verification_status = 'approved'
  `);
  res.json({ success: true, data: associations });
});

// Public Stats for Landing Page
router.get('/stats', (req, res: Response) => {
  const totalCases = query<{ count: number }>('SELECT COUNT(*) as count FROM case_files')[0]?.count || 0;
  const completedCases = query<{ count: number }>("SELECT COUNT(*) as count FROM case_files WHERE status = 'COMPLETED'")[0]?.count || 0;
  const specialistsCount = query<{ count: number }>("SELECT COUNT(*) as count FROM specialist_profiles WHERE verification_status = 'approved'")[0]?.count || 0;
  const centersCount = query<{ count: number }>("SELECT COUNT(*) as count FROM centers WHERE verification_status = 'approved'")[0]?.count || 0;
  const wilayasCovered = query<{ count: number }>('SELECT COUNT(DISTINCT wilaya_id) as count FROM users WHERE wilaya_id IS NOT NULL')[0]?.count || 12;

  res.json({
    success: true,
    data: {
      total_cases: totalCases,
      completed_cases: completedCases,
      specialists_count: specialistsCount,
      centers_count: centersCount,
      wilayas_covered: wilayasCovered,
      confidentiality_guarantee: '100% مشفر وسري'
    }
  });
});

export default router;
