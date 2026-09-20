import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../auth';
import { authenticateToken, AuthenticatedRequest, createAuditLog } from '../middleware';

const router = Router();

// Register
router.post('/register', (req, res: Response) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    password,
    role_slug,
    wilaya_id,
    commune_id,
    specialty,
    license_number,
    center_name,
    association_name,
    services
  } = req.body;

  // Real Validation
  const errors: Record<string, string> = {};
  if (!first_name || first_name.trim().length < 2) errors.first_name = 'الاسم الأول مطلوب ويجب ألا يقل عن حرفين';
  if (!last_name || last_name.trim().length < 2) errors.last_name = 'اسم العائلة مطلوب ويجب ألا يقل عن حرفين';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'يرجى إدخال بريد إلكتروني صالح';
  if (!phone || phone.trim().length < 9) errors.phone = 'رقم الهاتف مطلوب ويجب أن يكون صالحاً';
  if (!password || password.length < 6) errors.password = 'كلمة المرور يجب ألا تقل عن 6 أحرف';
  if (!role_slug) errors.role_slug = 'نوع الحساب مطلوب';

  if (Object.keys(errors).length > 0) {
    res.status(422).json({
      success: false,
      message: 'فشل التحقق من البيانات المدخلة',
      errors
    });
    return;
  }

  // Check unique email
  const existingUser = queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existingUser) {
    res.status(409).json({
      success: false,
      message: 'البريد الإلكتروني مسجل مسبقاً في المنصة',
      errors: { email: 'Email is already registered' }
    });
    return;
  }

  // Get role_id
  const role = queryOne<{ id: number; name: string }>('SELECT id, name FROM roles WHERE slug = ?', [role_slug]);
  const roleId = role ? role.id : 6; // default family if not found

  // Specialists and entities start as 'pending_approval' or 'active' based on policy
  const status = ['psychologist', 'lawyer', 'treatment_center', 'association'].includes(role_slug)
    ? 'pending_approval'
    : 'active';

  const passwordHash = hashPassword(password);

  const { lastInsertRowId } = execute(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, commune_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [first_name.trim(), last_name.trim(), email.toLowerCase().trim(), phone.trim(), passwordHash, roleId, role_slug, wilaya_id || 1, commune_id || null, status]);

  const userId = lastInsertRowId;

  // Insert supplementary profile if specialist
  if (role_slug === 'psychologist' || role_slug === 'lawyer') {
    execute(`
      INSERT INTO specialist_profiles (user_id, specialty, license_number, years_of_experience, bio, verification_status)
      VALUES (?, ?, ?, 1, 'ملف مهني مسجل حديثاً بانتظار استكمال الوثائق والاعتماد الرسمي', 'pending')
    `, [userId, specialty || (role_slug === 'psychologist' ? 'استشارات نفسية' : 'استشارات قانونية'), license_number || 'DZ-PENDING']);
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

  createAuditLog(userId, 'REGISTER', 'users', userId, `تسجيل حساب جديد بنوع ${role_slug}`, req.ip);

  const tokenUser = {
    id: userId,
    email: email.toLowerCase().trim(),
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    role_id: roleId,
    role_slug,
    wilaya_id: wilaya_id || 1
  };

  const accessToken = generateAccessToken(tokenUser);
  const refreshToken = generateRefreshToken(tokenUser);

  res.status(201).json({
    success: true,
    message: status === 'pending_approval' 
      ? 'تم إنشاء حسابك المهني بنجاح! سيتم مراجعة طلبك واعتماده من قبل الإدارة في أقرب وقت.'
      : 'تم إنشاء الحساب بنجاح! مرحباً بك في منصة الفرصة الثانية.',
    data: {
      user: tokenUser,
      status,
      token: accessToken,
      refreshToken
    }
  });
});

// Login
router.post('/login', (req, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({
      success: false,
      message: 'البريد الإلكتروني وكلمة المرور مطلوبان',
      errors: { credentials: 'Missing email or password' }
    });
    return;
  }

  const user = queryOne<any>(`
    SELECT u.*, w.name_ar as wilaya_name
    FROM users u
    LEFT JOIN wilayas w ON u.wilaya_id = w.id
    WHERE u.email = ?
  `, [email.toLowerCase().trim()]);

  if (!user || !comparePassword(password, user.password)) {
    res.status(401).json({
      success: false,
      message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      errors: { credentials: 'Invalid credentials' }
    });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({
      success: false,
      message: 'تم تجميد هذا الحساب لمخالفة سياسات المنصة. يرجى مراجعة إدارة المنصة.',
      errors: { account: 'Account suspended' }
    });
    return;
  }

  // Update last_login_at
  execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

  const tokenUser = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role_id: user.role_id,
    role_slug: user.role_slug,
    wilaya_id: user.wilaya_id
  };

  const accessToken = generateAccessToken(tokenUser);
  const refreshToken = generateRefreshToken(tokenUser);

  createAuditLog(user.id, 'LOGIN', 'users', user.id, 'تسجيل دخول ناجح إلى النظام', req.ip);

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: {
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role_slug: user.role_slug,
        wilaya_id: user.wilaya_id,
        wilaya_name: user.wilaya_name,
        status: user.status
      },
      token: accessToken,
      refreshToken
    }
  });
});

// Refresh Token
router.post('/refresh', (req, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401).json({ success: false, message: 'Refresh token missing' });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(403).json({ success: false, message: 'Invalid refresh token' });
    return;
  }

  const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [payload.id]);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const tokenUser = {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role_id: user.role_id,
    role_slug: user.role_slug,
    wilaya_id: user.wilaya_id
  };

  const newAccessToken = generateAccessToken(tokenUser);
  res.json({
    success: true,
    message: 'Token refreshed',
    data: { token: newAccessToken }
  });
});

// Get Current User (Me)
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const user = queryOne<any>(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role_slug, u.wilaya_id, u.commune_id, u.status, u.created_at,
           w.name_ar as wilaya_name
    FROM users u
    LEFT JOIN wilayas w ON u.wilaya_id = w.id
    WHERE u.id = ?
  `, [userId]);

  if (!user) {
    res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    return;
  }

  let specialistProfile = null;
  if (user.role_slug === 'psychologist' || user.role_slug === 'lawyer') {
    specialistProfile = queryOne('SELECT * FROM specialist_profiles WHERE user_id = ?', [userId]);
  }

  let centerProfile = null;
  if (user.role_slug === 'treatment_center') {
    centerProfile = queryOne('SELECT * FROM centers WHERE user_id = ?', [userId]);
  }

  let associationProfile = null;
  if (user.role_slug === 'association') {
    associationProfile = queryOne('SELECT * FROM associations WHERE user_id = ?', [userId]);
  }

  res.json({
    success: true,
    message: 'بيانات الملف الشخصي',
    data: {
      user,
      specialist: specialistProfile,
      center: centerProfile,
      association: associationProfile
    }
  });
});

// Update Profile
router.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { first_name, last_name, phone, wilaya_id, bio, specialty, availability_schedule } = req.body;

  execute(`
    UPDATE users
    SET first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        wilaya_id = COALESCE(?, wilaya_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [first_name, last_name, phone, wilaya_id, userId]);

  if (req.user!.role_slug === 'psychologist' || req.user!.role_slug === 'lawyer') {
    execute(`
      UPDATE specialist_profiles
      SET bio = COALESCE(?, bio),
          specialty = COALESCE(?, specialty),
          availability_schedule = COALESCE(?, availability_schedule)
      WHERE user_id = ?
    `, [bio, specialty, availability_schedule, userId]);
  }

  createAuditLog(userId, 'UPDATE_PROFILE', 'users', userId, 'تحديث الملف الشخصي للمستخدم', req.ip);

  res.json({
    success: true,
    message: 'تم تحديث البيانات بنجاح'
  });
});

// Change Password
router.put('/password', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { current_password, new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    res.status(422).json({
      success: false,
      message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
      errors: { new_password: 'Password too short' }
    });
    return;
  }

  const user = queryOne<{ password: string }>('SELECT password FROM users WHERE id = ?', [userId]);
  if (!user || !comparePassword(current_password, user.password)) {
    res.status(400).json({
      success: false,
      message: 'كلمة المرور الحالية غير صحيحة',
      errors: { current_password: 'Incorrect password' }
    });
    return;
  }

  const newHash = hashPassword(new_password);
  execute('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, userId]);

  createAuditLog(userId, 'CHANGE_PASSWORD', 'users', userId, 'تغيير كلمة المرور بنجاح', req.ip);

  res.json({
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح'
  });
});

export default router;
