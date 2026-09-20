import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { authenticateToken, AuthenticatedRequest, createAuditLog, createNotification } from '../middleware';

const router = Router();

// Get conversations for current user
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const conversations = query(`
    SELECT c.id, c.case_file_id, c.title, c.created_at,
           cf.number_case, cf.priority, cf.status as case_status,
           (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message_time,
           (SELECT COUNT(*) FROM messages m 
            WHERE m.conversation_id = c.id 
              AND m.sender_id != ? 
              AND NOT EXISTS (SELECT 1 FROM message_read_statuses WHERE message_id = m.id AND user_id = ?)
           ) as unread_count
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    JOIN case_files cf ON c.case_file_id = cf.id
    WHERE cp.user_id = ?
    ORDER BY COALESCE(last_message_time, c.created_at) DESC
  `, [user.id, user.id, user.id]);

  res.json({
    success: true,
    message: 'قائمة المحادثات الآمنة',
    data: conversations
  });
});

// Get messages in a conversation
router.get('/:id/messages', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const convId = Number(req.params.id);

  // Policy check: user must be participant or admin
  const isParticipant = queryOne('SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [convId, user.id]);
  if (!isParticipant && user.role_slug !== 'admin') {
    res.status(403).json({ success: false, message: 'غير مصرح لك بالوصول إلى هذه المحادثة' });
    return;
  }

  const messages = query(`
    SELECT m.*,
           u.first_name as sender_first_name, u.last_name as sender_last_name, u.role_slug as sender_role
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.id ASC
  `, [convId]);

  // Mark all unread messages as read
  const unreadMessages = query<{ id: number }>(`
    SELECT m.id FROM messages m
    WHERE m.conversation_id = ? 
      AND m.sender_id != ? 
      AND NOT EXISTS (SELECT 1 FROM message_read_statuses WHERE message_id = m.id AND user_id = ?)
  `, [convId, user.id, user.id]);

  unreadMessages.forEach(msg => {
    execute('INSERT INTO message_read_statuses (message_id, user_id) VALUES (?, ?)', [msg.id, user.id]);
  });

  res.json({
    success: true,
    message: 'رسائل المحادثة',
    data: messages
  });
});

// Send message
router.post('/:id/messages', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const convId = Number(req.params.id);
  const { content, attachment_url } = req.body;

  if (!content || content.trim().length === 0) {
    res.status(422).json({ success: false, message: 'محتوى الرسالة لا يمكن أن يكون فارغاً' });
    return;
  }

  // Check participation
  const isParticipant = queryOne('SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [convId, user.id]);
  if (!isParticipant && user.role_slug !== 'admin') {
    // Auto-join if user has rights
    execute('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', [convId, user.id]);
  }

  const { lastInsertRowId } = execute(`
    INSERT INTO messages (conversation_id, sender_id, content, attachment_url)
    VALUES (?, ?, ?, ?)
  `, [convId, user.id, content.trim(), attachment_url || null]);

  const msgId = lastInsertRowId;

  // Notify other participants
  const participants = query<{ user_id: number }>('SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id != ?', [convId, user.id]);
  participants.forEach(p => {
    createNotification(
      p.user_id,
      `رسالة جديدة من ${user.first_name} ${user.last_name}`,
      content.length > 50 ? `${content.substring(0, 50)}...` : content,
      'new_message',
      `/dashboard/messages`
    );
  });

  res.status(201).json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح',
    data: {
      id: msgId,
      conversation_id: convId,
      sender_id: user.id,
      content,
      attachment_url,
      created_at: new Date().toISOString()
    }
  });
});

export default router;
