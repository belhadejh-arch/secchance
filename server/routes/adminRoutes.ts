import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { hashPassword } from '../auth';
import { authenticateToken, AuthenticatedRequest, requireRole, createAuditLog, createNotification } from '../middleware';

const router = Router();

// List all users with filtering
router.get('/users', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { role, status, search } = req.query;
  let sql = `
    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role_slug, u.status, u.is_verified, u.last_login_at, u.created_at,
           w.name_ar as wilaya_name,
           r.name as role_name,
           sp.specialty, sp.license_number, sp.verification_status as specialist_approval
    FROM users u
    LEFT JOIN wilayas w ON u.wilaya_id = w.id
    LEFT JOIN roles r ON u.role_id = r.id
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

// Create a professional, partner, family, or patient account from the admin panel.
router.post('/users', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user!.id;
  const {
    first_name,
    last_name,
    email,
    phone,
    password,
    role_slug,
    wilaya_id,
    specialty,
    license_number,
    center_name,
    association_name,
    services,
  } = req.body;

  const allowedRoles = ['psychologist', 'lawyer', 'treatment_center', 'association', 'family', 'patient'];
  const errors: Record<string, string> = {};
  if (!first_name || String(first_name).trim().length < 2) errors.first_name = 'الاسم الأول مطلوب';
  if (!last_name || String(last_name).trim().length < 2) errors.last_name = 'اسم العائلة مطلوب';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) errors.email = 'البريد الإلكتروني غير صالح';
  if (!phone || String(phone).trim().length < 9) errors.phone = 'رقم الهاتف مطلوب';
  if (!password || String(password).length < 8) errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  if (!allowedRoles.includes(role_slug)) errors.role_slug = 'نوع الحساب غير مسموح';

  if (Object.keys(errors).length > 0) {
    res.status(422).json({ success: false, message: 'يرجى تصحيح بيانات الحساب', errors });
    return;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  if (queryOne('SELECT id FROM users WHERE email = ?', [normalizedEmail])) {
    res.status(409).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً', errors: { email: 'Email already exists' } });
    return;
  }

  const role = queryOne<{ id: number; name: string }>('SELECT id, name FROM roles WHERE slug = ?', [role_slug]);
  if (!role) {
    res.status(422).json({ success: false, message: 'الدور المطلوب غير موجود' });
    return;
  }

  const isProfessional = ['psychologist', 'lawyer', 'treatment_center', 'association'].includes(role_slug);
  const status = isProfessional ? 'pending_approval' : 'active';
  const { lastInsertRowId: userId } = execute(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [
    String(first_name).trim(),
    String(last_name).trim(),
    normalizedEmail,
    String(phone).trim(),
    hashPassword(String(password)),
    role.id,
    role_slug,
    wilaya_id || 1,
    status,
  ]);

  if (role_slug === 'psychologist' || role_slug === 'lawyer') {
    execute(`
      INSERT INTO specialist_profiles (user_id, specialty, license_number, years_of_experience, bio, verification_status)
      VALUES (?, ?, ?, 1, ?, 'pending')
    `, [
      userId,
      specialty || (role_slug === 'psychologist' ? 'استشارات نفسية' : 'استشارات قانونية'),
      license_number || 'DZ-PENDING',
      'تم إنشاء الحساب من طرف الإدارة، بانتظار استكمال التحقق المهني.',
    ]);
  } else if (role_slug === 'treatment_center') {
    execute(`
      INSERT INTO centers (user_id, name, wilaya_id, phone, services, verification_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [userId, center_name || `${first_name} ${last_name}`, wilaya_id || 1, phone, services || 'علاج وتأهيل الإدمان']);
  } else if (role_slug === 'association') {
    execute(`
      INSERT INTO associations (user_id, name, wilaya_id, phone, services, verification_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [userId, association_name || `${first_name} ${last_name}`, wilaya_id || 1, phone, services || 'دعم اجتماعي ومرافقة']);
  }

  createAuditLog(adminId, 'CREATE_USER', 'users', userId, `إنشاء حساب ${role_slug} من لوحة الإدارة`, req.ip);
  res.status(201).json({
    success: true,
    message: isProfessional ? 'تم إنشاء الحساب وهو بانتظار الاعتماد المهني' : 'تم إنشاء الحساب وتفعيله',
    data: { id: userId, email: normalizedEmail, role_slug, status },
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
