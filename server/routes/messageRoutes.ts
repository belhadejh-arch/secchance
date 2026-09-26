import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { authenticateToken, AuthenticatedRequest, createAuditLog, createNotification } from '../middleware';

const router = Router();

function conversationAccess(conversationId: number, user: NonNullable<AuthenticatedRequest['user']>): { allowed: boolean; caseFileId: number | null; serviceRequest: any | null } {
  const conversation = queryOne<any>('SELECT case_file_id FROM conversations WHERE id = ?', [conversationId]);
  if (!conversation) return { allowed: false, caseFileId: null, serviceRequest: null };
  const serviceRequest = queryOne<any>('SELECT requester_id, provider_id, assigned_staff_id FROM service_requests WHERE case_file_id = ?', [conversation.case_file_id]);
  if (user.role_slug === 'admin') return { allowed: true, caseFileId: conversation.case_file_id, serviceRequest };
  if (serviceRequest) {
    const caseFile = queryOne<any>('SELECT created_by, patient_id FROM case_files WHERE id = ?', [conversation.case_file_id]);
    const isClient = serviceRequest.requester_id === user.id || caseFile?.created_by === user.id || caseFile?.patient_id === user.id;
    const isProvider = serviceRequest.provider_id === user.id;
    const isCurrentStaff = Number(serviceRequest.assigned_staff_id) === user.id &&
      !!queryOne('SELECT id FROM provider_staff WHERE provider_id = ? AND staff_user_id = ? AND is_active = 1',
        [serviceRequest.provider_id, user.id]);
    return { allowed: isClient || isProvider || isCurrentStaff, caseFileId: conversation.case_file_id, serviceRequest };
  }
  const participant = queryOne('SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [conversationId, user.id]);
  return { allowed: !!participant, caseFileId: conversation.case_file_id, serviceRequest: null };
}

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
     WHERE cp.user_id = ? AND (
       NOT EXISTS (SELECT 1 FROM service_requests sr WHERE sr.case_file_id = cf.id)
       OR EXISTS (
         SELECT 1 FROM service_requests sr
         WHERE sr.case_file_id = cf.id AND (
           sr.requester_id = ? OR sr.provider_id = ? OR (
             sr.assigned_staff_id = ? AND EXISTS (
               SELECT 1 FROM provider_staff ps WHERE ps.provider_id = sr.provider_id
                 AND ps.staff_user_id = ? AND ps.is_active = 1
             )
           )
         )
       )
     )
    ORDER BY COALESCE(last_message_time, c.created_at) DESC
  `, [user.id, user.id, user.id, user.id, user.id, user.id, user.id]);

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
  const access = conversationAccess(convId, user);
  if (!access.allowed) {
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
  const access = conversationAccess(convId, user);
  if (!access.allowed) {
    res.status(403).json({ success: false, message: 'غير مصرح لك بإرسال رسالة في هذه المحادثة' });
    return;
  }
  const isParticipant = queryOne('SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [convId, user.id]);
  if (!isParticipant && user.role_slug !== 'admin') {
    execute('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)', [convId, user.id]);
  }

  const { lastInsertRowId } = execute(`
    INSERT INTO messages (conversation_id, sender_id, content, attachment_url)
    VALUES (?, ?, ?, ?)
  `, [convId, user.id, content.trim(), attachment_url || null]);

  const msgId = lastInsertRowId;

  // Notify other participants
  const participants = access.serviceRequest
    ? query<{ user_id: number }>(`
        SELECT cp.user_id FROM conversation_participants cp
        LEFT JOIN case_files cf ON cf.id = ?
        WHERE cp.conversation_id = ? AND cp.user_id != ? AND (
          cp.user_id = ? OR cp.user_id = ? OR cf.created_by = cp.user_id OR cf.patient_id = cp.user_id OR (
            cp.user_id = ? AND EXISTS (SELECT 1 FROM provider_staff ps WHERE ps.provider_id = ?
              AND ps.staff_user_id = cp.user_id AND ps.is_active = 1)
          )
        )
      `, [access.caseFileId, convId, user.id, access.serviceRequest.requester_id,
        access.serviceRequest.provider_id, access.serviceRequest.assigned_staff_id,
        access.serviceRequest.provider_id])
    : query<{ user_id: number }>('SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id != ?', [convId, user.id]);
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
