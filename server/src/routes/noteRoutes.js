import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middlewares/auth.js';
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from '../modules/notes/noteController.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = new Set([
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/html',
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]);

    if (allowed.has(file.mimetype) || file.mimetype.startsWith('text/')) {
      return cb(null, true);
    }

    return cb(new Error('지원하지 않는 파일 형식입니다.'));
  },
});

const noteRouter = Router();
noteRouter.use(requireAuth);

noteRouter.get('/', listNotes);
noteRouter.get('/:id', getNoteById);
noteRouter.post('/', upload.array('files', 5), createNote);
noteRouter.put('/:id', upload.array('files', 5), updateNote);
noteRouter.delete('/:id', deleteNote);

export default noteRouter;
