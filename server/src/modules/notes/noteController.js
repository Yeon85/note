import fs from 'fs';
import path from 'path';
import { runQuery } from '../../config/db.js';

function getNowDateTimeString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function mapRowsToNotes(rows) {
  const notesById = new Map();

  for (const row of rows) {
    if (!notesById.has(row.id)) {
      notesById.set(row.id, {
        id: row.id,
        title: row.title,
        content: row.content,
        theme: row.theme,
        categoryId: row.category_id ?? null,
        categoryName: row.category_name ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        files: [],
      });
    }

    if (row.file_id) {
      notesById.get(row.id).files.push({
        id: row.file_id,
        originalName: row.original_name,
        storedName: row.stored_name,
        mimeType: row.mime_type,
        size: row.size,
        url: `/api/files/${row.file_id}`,
      });
    }
  }

  return Array.from(notesById.values());
}

function isMissingCategoriesSchemaError(error) {
  if (error?.code !== 'ER_NO_SUCH_TABLE' && error?.code !== 'ER_BAD_FIELD_ERROR') return false;
  const msg = String(error?.sqlMessage || error?.message || '');
  return msg.includes('note_categories') || msg.includes('category_id');
}

async function ensureCategoryOwnedByUserOrNull(userId, categoryId) {
  if (categoryId == null) return null;

  const rows = await runQuery(
    `SELECT id
     FROM note_categories
     WHERE id = :categoryId AND user_id = :userId
     LIMIT 1`,
    { categoryId, userId },
  );
  if (rows.length === 0) {
    const err = new Error('선택한 카테고리를 사용할 수 없습니다.');
    err.statusCode = 400;
    throw err;
  }
  return categoryId;
}

function parseCategoryId(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s === 'none') return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export async function getNoteById(req, res, next) {
  try {
    const noteId = Number(req.params.id);
    if (!Number.isFinite(noteId)) {
      return res.status(400).json({ message: '잘못된 노트 ID입니다.' });
    }

    let rows;
    try {
      rows = await runQuery(
        `SELECT n.id, n.title, n.content, n.theme, n.category_id, c.name AS category_name, n.created_at, n.updated_at,
                f.id AS file_id, f.original_name, f.stored_name, f.mime_type, f.size
         FROM notes n
         LEFT JOIN note_categories c ON c.id = n.category_id AND c.user_id = n.user_id
         LEFT JOIN note_files f ON f.note_id = n.id
         WHERE n.user_id = :userId AND n.id = :noteId
         ORDER BY f.id ASC`,
        { userId: req.user.id, noteId },
      );
    } catch (error) {
      if (!isMissingCategoriesSchemaError(error)) throw error;
      rows = await runQuery(
        `SELECT n.id, n.title, n.content, n.theme, n.created_at, n.updated_at,
                f.id AS file_id, f.original_name, f.stored_name, f.mime_type, f.size
         FROM notes n
         LEFT JOIN note_files f ON f.note_id = n.id
         WHERE n.user_id = :userId AND n.id = :noteId
         ORDER BY f.id ASC`,
        { userId: req.user.id, noteId },
      );
    }

    const notes = mapRowsToNotes(rows);
    const note = notes[0];
    if (!note) {
      return res.status(404).json({ message: '노트를 찾을 수 없습니다.' });
    }

    return res.json({ note });
  } catch (error) {
    return next(error);
  }
}

export async function listNotes(req, res, next) {
  try {
    const categoryIdRaw = req.query.categoryId;
    const categoryId = parseCategoryId(categoryIdRaw);
    if (categoryId === undefined) {
      return res.status(400).json({ message: '잘못된 카테고리 ID입니다.' });
    }

    let whereSql = 'WHERE n.user_id = :userId';
    const params = { userId: req.user.id };
    if (String(categoryIdRaw || '').trim() === 'none') {
      whereSql += ' AND n.category_id IS NULL';
    } else if (categoryId != null) {
      whereSql += ' AND n.category_id = :categoryId';
      params.categoryId = categoryId;
    }

    let rows;
    try {
      rows = await runQuery(
        `SELECT n.id, n.title, n.content, n.theme, n.category_id, c.name AS category_name, n.created_at, n.updated_at,
                f.id AS file_id, f.original_name, f.stored_name, f.mime_type, f.size
         FROM notes n
         LEFT JOIN note_categories c ON c.id = n.category_id AND c.user_id = n.user_id
         LEFT JOIN note_files f ON f.note_id = n.id
         ${whereSql}
         ORDER BY n.updated_at DESC, f.id ASC`,
        params,
      );
    } catch (error) {
      if (!isMissingCategoriesSchemaError(error)) throw error;

      if (String(categoryIdRaw || '').trim()) {
        return res.status(503).json({
          message: '카테고리 기능을 사용하려면 DB 마이그레이션이 필요합니다. 서버에서 npm run db:categories 를 실행해 주세요.',
        });
      }

      rows = await runQuery(
        `SELECT n.id, n.title, n.content, n.theme, n.created_at, n.updated_at,
                f.id AS file_id, f.original_name, f.stored_name, f.mime_type, f.size
         FROM notes n
         LEFT JOIN note_files f ON f.note_id = n.id
         WHERE n.user_id = :userId
         ORDER BY n.updated_at DESC, f.id ASC`,
        { userId: req.user.id },
      );
    }
    return res.json({ notes: mapRowsToNotes(rows) });
  } catch (error) {
    return next(error);
  }
}

export async function createNote(req, res, next) {
  try {
    const { title, content, theme } = req.body;
    const parsedCategoryId = parseCategoryId(req.body?.categoryId);
    if (parsedCategoryId === undefined) {
      return res.status(400).json({ message: '잘못된 카테고리 ID입니다.' });
    }
    const categoryId = await ensureCategoryOwnedByUserOrNull(req.user.id, parsedCategoryId);

    const finalTitle = (title && String(title).trim()) ? String(title).trim() : getNowDateTimeString();
    const finalContent = content != null ? String(content) : '';

    const result = await runQuery(
      `INSERT INTO notes (user_id, category_id, title, content, theme)
       VALUES (:userId, :categoryId, :title, :content, :theme)`,
      {
        userId: req.user.id,
        categoryId,
        title: finalTitle,
        content: finalContent,
        theme: theme === 'dark' ? 'dark' : 'light',
      },
    );

    const noteId = result.insertId;
    const files = req.files || [];
    for (const file of files) {
      await runQuery(
        `INSERT INTO note_files (note_id, original_name, stored_name, mime_type, size)
         VALUES (:noteId, :originalName, :storedName, :mimeType, :size)`,
        {
          noteId,
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
        },
      );
    }

    return res.status(201).json({ id: noteId });
  } catch (error) {
    return next(error);
  }
}

export async function updateNote(req, res, next) {
  try {
    const noteId = Number(req.params.id);
    const { title, content, theme } = req.body;
    if (!Number.isFinite(noteId)) {
      return res.status(400).json({ message: '잘못된 노트 ID입니다.' });
    }

    const parsedCategoryId = parseCategoryId(req.body?.categoryId);
    if (parsedCategoryId === undefined) {
      return res.status(400).json({ message: '잘못된 카테고리 ID입니다.' });
    }
    const categoryId = await ensureCategoryOwnedByUserOrNull(req.user.id, parsedCategoryId);

    const rows = await runQuery(
      'SELECT id FROM notes WHERE id = :noteId AND user_id = :userId LIMIT 1',
      { noteId, userId: req.user.id },
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '노트를 찾을 수 없습니다.' });
    }

    const finalTitle = (title && String(title).trim()) ? String(title).trim() : getNowDateTimeString();
    const finalContent = content != null ? String(content) : '';

    await runQuery(
      `UPDATE notes
       SET category_id = :categoryId, title = :title, content = :content, theme = :theme, updated_at = NOW()
       WHERE id = :noteId`,
      {
        noteId,
        categoryId,
        title: finalTitle,
        content: finalContent,
        theme: theme === 'dark' ? 'dark' : 'light',
      },
    );

    const files = req.files || [];
    for (const file of files) {
      await runQuery(
        `INSERT INTO note_files (note_id, original_name, stored_name, mime_type, size)
         VALUES (:noteId, :originalName, :storedName, :mimeType, :size)`,
        {
          noteId,
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          size: file.size,
        },
      );
    }

    return res.json({ message: '노트가 수정되었습니다.' });
  } catch (error) {
    return next(error);
  }
}

export async function deleteNote(req, res, next) {
  try {
    const noteId = Number(req.params.id);
    if (!Number.isFinite(noteId)) {
      return res.status(400).json({ message: '잘못된 노트 ID입니다.' });
    }

    const rows = await runQuery(
      'SELECT id FROM notes WHERE id = :noteId AND user_id = :userId LIMIT 1',
      { noteId, userId: req.user.id },
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '노트를 찾을 수 없습니다.' });
    }

    const files = await runQuery(
      'SELECT stored_name FROM note_files WHERE note_id = :noteId',
      { noteId },
    );
    for (const file of files) {
      const filePath = path.resolve(process.cwd(), 'uploads', file.stored_name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await runQuery('DELETE FROM note_files WHERE note_id = :noteId', { noteId });
    await runQuery('DELETE FROM notes WHERE id = :noteId', { noteId });
    return res.json({ message: '노트가 삭제되었습니다.' });
  } catch (error) {
    return next(error);
  }
}
