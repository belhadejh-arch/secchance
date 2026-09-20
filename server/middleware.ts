import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayloadUser } from './auth';
import { execute } from './db';

// Extend Express Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: JwtPayloadUser;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير موجود أو منتهي الصلاحية. يرجى تسجيل الدخول.',
      errors: { auth: 'Missing or expired token' }
    });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(403).json({
      success: false,
      message: 'رمز المصادقة غير صالح.',
      errors: { auth: 'Invalid token' }
    });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'يتطلب هذا الإجراء تسجيل الدخول أولاً.',
        errors: { auth: 'Authentication required' }
      });
      return;
    }

    if (req.user.role_slug === 'admin') {
      // Admin has full access according to system rules
      return next();
    }

    if (!allowedRoles.includes(req.user.role_slug)) {
      res.status(403).json({
        success: false,
        message: 'ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.',
        errors: { permission: 'Forbidden: Insufficient privileges' }
      });
      return;
    }

    next();
  };
}

export function createAuditLog(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: string | number,
  details: string,
  ipAddress?: string
): void {
  try {
    execute(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, action, entityType, String(entityId), details, ipAddress || '127.0.0.1']);
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

export function createNotification(
  userId: number,
  title: string,
  message: string,
  type: string = 'info',
  link?: string
): void {
  try {
    execute(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, title, message, type, link || null]);
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
