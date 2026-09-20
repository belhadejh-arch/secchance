import { Router, Response } from 'express';
import { query, execute } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware';

const router = Router();

// Get Notifications
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifications = query(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 50
  `, [user.id]);

  const unreadCount = query<{ count: number }>(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `, [user.id])[0]?.count || 0;

  res.json({
    success: true,
    message: 'قائمة الإشعارات',
    data: {
      notifications,
      unread_count: unreadCount
    }
  });
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifId = Number(req.params.id);

  execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, user.id]);

  res.json({
    success: true,
    message: 'تم تعيين الإشعار كمقروء'
  });
});

// Mark all as read
router.put('/read-all', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user.id]);

  res.json({
    success: true,
    message: 'تم تعيين جميع الإشعارات كمقروءة'
  });
});

export default router;
