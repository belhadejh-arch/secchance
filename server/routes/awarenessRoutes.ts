import { Router, Response } from 'express';
import { query, queryOne, execute } from '../db';
import { authenticateToken, AuthenticatedRequest, requireRole, createAuditLog } from '../middleware';

const router = Router();

// GET all awareness studies and articles (Public + Admin filter)
router.get('/', (req, res: Response) => {
  const { category, search, status, topic } = req.query;
  
  let sql = `
    SELECT a.id, a.title, a.category, a.topic, a.author, a.summary,
           a.file_name, a.file_size, a.tags, a.status, a.is_featured,
           a.views_count, a.created_at, a.updated_at,
           CASE WHEN a.file_url IS NOT NULL AND a.file_url != '' THEN 1 ELSE 0 END as has_file,
           u.first_name as publisher_first_name, u.last_name as publisher_last_name
    FROM awareness_articles a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // If status is specifically requested (e.g. from admin portal)
  if (status && status !== 'all') {
    sql += ' AND a.status = ?';
    params.push(status);
  } else if (!status) {
    // Default public view only sees published articles
    sql += " AND a.status = 'published'";
  }

  if (category && category !== 'all') {
    sql += ' AND a.category = ?';
    params.push(category);
  }

  if (topic && topic !== 'all') {
    sql += ' AND a.topic = ?';
    params.push(topic);
  }

  if (search) {
    sql += ' AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ? OR a.author LIKE ? OR a.tags LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  sql += ' ORDER BY a.is_featured DESC, a.id DESC';
  const articles = query(sql, params);

  res.json({
    success: true,
    data: articles
  });
});

// GET single study / article with full content and file
router.get('/:id', (req, res: Response) => {
  const { id } = req.params;
  const article = queryOne(`
    SELECT a.*,
           u.first_name as publisher_first_name, u.last_name as publisher_last_name
    FROM awareness_articles a
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = ?
  `, [id]);

  if (!article) {
    res.status(404).json({ success: false, message: 'الدراسة أو المقال غير موجود' });
    return;
  }

  // Increment views count silently
  execute('UPDATE awareness_articles SET views_count = views_count + 1 WHERE id = ?', [id]);

  res.json({
    success: true,
    data: {
      ...article,
      views_count: (article.views_count || 0) + 1
    }
  });
});

// POST: Upload and publish a scientific study or awareness article (Admin only)
router.post('/', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user!.id;
  const {
    title,
    category,
    topic,
    author,
    summary,
    content,
    file_url,
    file_name,
    file_size,
    tags,
    status = 'published',
    is_featured = 0
  } = req.body;

  if (!title || String(title).trim().length < 3) {
    res.status(422).json({ success: false, message: 'عنوان الدراسة أو المقال مطلوب' });
    return;
  }

  if (!summary || String(summary).trim().length < 10) {
    res.status(422).json({ success: false, message: 'ملخص الدراسة أو البحث مطلوب (10 أحرف على الأقل)' });
    return;
  }

  const articleCategory = category || 'دراسة علمية محكّمة';
  const articleAuthor = author || `${req.user!.first_name} ${req.user!.last_name} (إدارة المنصة)`;

  const { lastInsertRowId } = execute(`
    INSERT INTO awareness_articles (
      title, category, topic, author, summary, content,
      file_url, file_name, file_size, tags, status, is_featured, created_by, views_count
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `, [
    String(title).trim(),
    articleCategory,
    topic || 'المؤثرات العقلية والمخدرات',
    articleAuthor,
    String(summary).trim(),
    content || '',
    file_url || null,
    file_name || null,
    file_size || null,
    tags || '',
    status,
    is_featured ? 1 : 0,
    adminId
  ]);

  createAuditLog(
    adminId,
    'PUBLISH_STUDY',
    'awareness_articles',
    lastInsertRowId,
    `نشر/رفع دراسة أو محتوى توعوي جديد: ${title}`,
    req.ip
  );

  const newArticle = queryOne('SELECT * FROM awareness_articles WHERE id = ?', [lastInsertRowId]);

  res.status(201).json({
    success: true,
    message: 'تم نشر الدراسة / المقال التوعوي بنجاح',
    data: newArticle
  });
});

// PUT: Update an existing study or article (Admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id } = req.params;
  const existing = queryOne('SELECT id, title FROM awareness_articles WHERE id = ?', [id]);

  if (!existing) {
    res.status(404).json({ success: false, message: 'الدراسة غير موجودة' });
    return;
  }

  const {
    title,
    category,
    topic,
    author,
    summary,
    content,
    file_url,
    file_name,
    file_size,
    tags,
    status,
    is_featured
  } = req.body;

  execute(`
    UPDATE awareness_articles
    SET title = COALESCE(?, title),
        category = COALESCE(?, category),
        topic = COALESCE(?, topic),
        author = COALESCE(?, author),
        summary = COALESCE(?, summary),
        content = COALESCE(?, content),
        file_url = CASE WHEN ? IS NOT NULL THEN ? ELSE file_url END,
        file_name = CASE WHEN ? IS NOT NULL THEN ? ELSE file_name END,
        file_size = CASE WHEN ? IS NOT NULL THEN ? ELSE file_size END,
        tags = COALESCE(?, tags),
        status = COALESCE(?, status),
        is_featured = CASE WHEN ? IS NOT NULL THEN ? ELSE is_featured END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    title ? String(title).trim() : null,
    category,
    topic,
    author,
    summary ? String(summary).trim() : null,
    content,
    file_url, file_url,
    file_name, file_name,
    file_size, file_size,
    tags,
    status,
    is_featured !== undefined ? (is_featured ? 1 : 0) : null,
    is_featured !== undefined ? (is_featured ? 1 : 0) : null,
    id
  ]);

  createAuditLog(
    adminId,
    'UPDATE_STUDY',
    'awareness_articles',
    Number(id),
    `تحديث بيانات الدراسة: ${title || existing.title}`,
    req.ip
  );

  const updated = queryOne('SELECT * FROM awareness_articles WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'تم تحديث الدراسة بنجاح',
    data: updated
  });
});

// DELETE: Delete a study or article (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user!.id;
  const { id } = req.params;
  const existing = queryOne('SELECT id, title FROM awareness_articles WHERE id = ?', [id]);

  if (!existing) {
    res.status(404).json({ success: false, message: 'الدراسة غير موجودة' });
    return;
  }

  execute('DELETE FROM awareness_articles WHERE id = ?', [id]);

  createAuditLog(
    adminId,
    'DELETE_STUDY',
    'awareness_articles',
    Number(id),
    `حذف دراسة أو محتوى توعوي: ${existing.title}`,
    req.ip
  );

  res.json({
    success: true,
    message: 'تم حذف الدراسة بنجاح'
  });
});

export default router;
