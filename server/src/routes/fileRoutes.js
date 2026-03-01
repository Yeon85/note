import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { runQuery } from '../config/db.js';

const fileRouter = Router();
fileRouter.use(requireAuth);

fileRouter.get('/:id', async (req, res, next) => {
  try {
    const fileId = Number(req.params.id);
    if (!Number.isFinite(fileId)) {
      return res.status(400).json({ message: '잘못된 파일 ID입니다.' });
    }

    const rows = await runQuery(
      `SELECT f.id, f.original_name, f.stored_name
       FROM note_files f
       INNER JOIN notes n ON n.id = f.note_id
       WHERE f.id = :fileId AND n.user_id = :userId
       LIMIT 1`,
      { fileId, userId: req.user.id },
    );

    const file = rows[0];
    if (!file) {
      return res.status(404).json({ message: '파일을 찾을 수 없습니다.' });
    }

    const filePath = path.resolve(process.cwd(), 'uploads', file.stored_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '서버에서 파일을 찾을 수 없습니다.' });
    }

    return res.download(filePath, file.original_name);
  } catch (error) {
    return next(error);
  }
});

export default fileRouter;

