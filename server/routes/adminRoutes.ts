import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole, createAuditLog, createNotification } from '../middleware';

const router = Router();

// List all users with filtering
router.get('/users', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { role, status, search } = req.query;
  let sql = `
    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role_slug, u.status, u.is_verified, u.last_login_at, u.created_at,
           w.name_ar as wilaya_name,
           sp.specialty, sp.license_number, sp.verification_status as specialist_approval
    FROM users u
    LEFT JOIN wilayas w ON u.wilaya_id = w.id
    LEFT JOIN specialist_profiles sp ON u.id = sp.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role) {
    sql += ' AND u.role_slug = ?';
    params.push(role);
  }
  if (status) {
    sql += ' AND u.status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY u.id DESC';
  const users = query(sql, params);

  res.json({
    success: true,
    message: 'قائمة المستخدمين',
    data: users
  });
});

// Update User Status (approve specialist, activate, suspend)
router.put('/users/:id/status', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user!.id;
  const targetUserId = Number(req.params.id);
  const { status, specialist_approval } = req.body;

  const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [targetUserId]);
  if (!user) {
    res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    return;
  }

  if (status) {
    execute('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, targetUserId]);
  }

  if (specialist_approval) {
    execute('UPDATE specialist_profiles SET verification_status = ? WHERE user_id = ?', [specialist_approval, targetUserId]);
    execute('UPDATE centers SET verification_status = ? WHERE user_id = ?', [specialist_approval, targetUserId]);
    execute('UPDATE associations SET verification_status = ? WHERE user_id = ?', [specialist_approval, targetUserId]);

    if (specialist_approval === 'approved') {
      execute("UPDATE users SET status = 'active' WHERE id = ?", [targetUserId]);
    }
  }

  createNotification(
    targetUserId,
    'تحديث حالة حسابك',
    status === 'active' || specialist_approval === 'approved'
      ? 'تهانينا! تم التحقق من هويتك المهنية وتنشيط حسابك بالكامل في المنصة.'
      : `تم تحديث حالة حسابك إلى: ${status || specialist_approval}`,
    'account_status',
    '/dashboard'
  );

  createAuditLog(adminId, 'UPDATE_USER_STATUS', 'users', targetUserId, `تحديث حالة المستخدم إلى ${status || specialist_approval}`, req.ip);

  res.json({
    success: true,
    message: 'تم تحديث حالة الحساب بنجاح'
  });
});

// Audit Logs
router.get('/audit-logs', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const logs = query(`
    SELECT al.*, u.first_name, u.last_name, u.role_slug, u.email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.id DESC
    LIMIT 100
  `);

  res.json({
    success: true,
    message: 'سجلات التدقيق الأمني Audit Logs',
    data: logs
  });
});

// System Settings
router.get('/settings', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const settings = query('SELECT * FROM system_settings');
  const configMap: Record<string, string> = {};
  settings.forEach(s => {
    configMap[s.key] = s.value;
  });

  res.json({
    success: true,
    message: 'إعدادات النظام',
    data: configMap
  });
});

// Update System Settings
router.put('/settings', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user!.id;
  const updates: Record<string, string> = req.body;

  Object.entries(updates).forEach(([k, v]) => {
    execute('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)', [k, String(v)]);
  });

  createAuditLog(adminId, 'UPDATE_SETTINGS', 'system_settings', 0, 'تعديل إعدادات النظام العامة', req.ip);

  res.json({
    success: true,
    message: 'تم حفظ إعدادات النظام بنجاح'
  });
});

export default router;
