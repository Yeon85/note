import { runQuery } from '../../config/db.js';

function parseName(input) {
  const name = String(input || '').trim();
  if (!name) return { ok: false, message: '카테고리 이름을 입력해 주세요.' };
  if (name.length > 60) return { ok: false, message: '카테고리 이름은 60자 이하여야 합니다.' };
  return { ok: true, name };
}

export async function listCategories(req, res, next) {
  try {
    const rows = await runQuery(
      `SELECT id, name, created_at
       FROM note_categories
       WHERE user_id = :userId
       ORDER BY name ASC, id ASC`,
      { userId: req.user.id },
    );
    return res.json({
      categories: rows.map((r) => ({
        id: r.id,
        name: r.name,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const parsed = parseName(req.body?.name);
    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    const result = await runQuery(
      `INSERT INTO note_categories (user_id, name)
       VALUES (:userId, :name)`,
      { userId: req.user.id, name: parsed.name },
    );
    return res.status(201).json({ id: result.insertId, name: parsed.name });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 존재하는 카테고리입니다.' });
    }
    return next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.id);
    if (!Number.isFinite(categoryId)) {
      return res.status(400).json({ message: '잘못된 카테고리 ID입니다.' });
    }

    const parsed = parseName(req.body?.name);
    if (!parsed.ok) {
      return res.status(400).json({ message: parsed.message });
    }

    const rows = await runQuery(
      'SELECT id FROM note_categories WHERE id = :categoryId AND user_id = :userId LIMIT 1',
      { categoryId, userId: req.user.id },
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }

    await runQuery(
      `UPDATE note_categories
       SET name = :name
       WHERE id = :categoryId AND user_id = :userId`,
      { categoryId, userId: req.user.id, name: parsed.name },
    );

    return res.json({ message: '카테고리가 수정되었습니다.' });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 존재하는 카테고리입니다.' });
    }
    return next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.id);
    if (!Number.isFinite(categoryId)) {
      return res.status(400).json({ message: '잘못된 카테고리 ID입니다.' });
    }

    const rows = await runQuery(
      'SELECT id FROM note_categories WHERE id = :categoryId AND user_id = :userId LIMIT 1',
      { categoryId, userId: req.user.id },
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }

    // Safety: even without FK, detach notes first.
    await runQuery(
      `UPDATE notes
       SET category_id = NULL
       WHERE user_id = :userId AND category_id = :categoryId`,
      { userId: req.user.id, categoryId },
    );

    await runQuery(
      `DELETE FROM note_categories
       WHERE id = :categoryId AND user_id = :userId`,
      { categoryId, userId: req.user.id },
    );

    return res.json({ message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    return next(error);
  }
}

