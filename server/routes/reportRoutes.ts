import { Router, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware';

const router = Router();

// KPIs and Platform Analytics
router.get('/kpis', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  // Total cases
  const totalCases = query<{ count: number }>('SELECT COUNT(*) as count FROM case_files')[0]?.count || 0;

  // Cases by status
  const casesByStatus = query<{ status: string; count: number }>(`
    SELECT status, COUNT(*) as count
    FROM case_files
    GROUP BY status
  `);

  // Cases by priority
  const casesByPriority = query<{ priority: string; count: number }>(`
    SELECT priority, COUNT(*) as count
    FROM case_files
    GROUP BY priority
  `);

  // Cases by addiction type
  const casesByAddiction = query<{ name_ar: string; count: number }>(`
    SELECT at.name_ar, COUNT(c.id) as count
    FROM case_files c
    JOIN addiction_types at ON c.addiction_type_id = at.id
    GROUP BY at.id
  `);

  // Users count by role
  const usersByRole = query<{ role_slug: string; count: number }>(`
    SELECT role_slug, COUNT(*) as count
    FROM users
    GROUP BY role_slug
  `);

  // Appointments summary
  const appointmentsSummary = query<{ status: string; count: number }>(`
    SELECT status, COUNT(*) as count
    FROM appointments
    GROUP BY status
  `);

  // Average response time mock/calc
  const completedCount = query<{ count: number }>("SELECT COUNT(*) as count FROM case_files WHERE status = 'COMPLETED'")[0]?.count || 0;
  const activeCount = totalCases - completedCount;
  const recoveryRate = totalCases > 0 ? Math.round((completedCount / totalCases) * 100) : 0;

  res.json({
    success: true,
    message: 'المؤشرات والتحليلات الإحصائية للمنصة',
    data: {
      total_cases: totalCases,
      completed_cases: completedCount,
      active_cases: activeCount,
      recovery_rate_pct: recoveryRate,
      cases_by_status: casesByStatus,
      cases_by_priority: casesByPriority,
      cases_by_addiction: casesByAddiction,
      users_by_role: usersByRole,
      appointments_summary: appointmentsSummary
    }
  });
});

export default router;
