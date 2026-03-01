import cors from 'cors';
import express from 'express';
import path from 'path';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRouter from './routes/authRoutes.js';
import fileRouter from './routes/fileRoutes.js';
import noteRouter from './routes/noteRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRouter);
app.use('/api/files', fileRouter);
app.use('/api/notes', noteRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${env.port}`);
});
