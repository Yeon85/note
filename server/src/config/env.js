import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const cwd = process.cwd();

// 1) 공통/배포용: .env, env.example (먼저 로드, override: false)
const candidatePaths = [
  path.resolve(cwd, '..', '.env'),
  path.resolve(cwd, '.env'),
  path.resolve(cwd, 'env.example'),
];

for (const envPath of candidatePaths) {
  dotenv.config({ path: envPath, override: false });
}

// 2) 로컬 전용: .env.local 있으면 덮어씀 (로컬 테스트 시 URL 등만 바꿀 때 사용)
const envLocalPath = path.resolve(cwd, '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}

const required = ['DATABASE_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      'Create server/.env or set it in root .env (fallback: server/env.example).',
    );
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4090),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  appBaseUrl: process.env.APP_BASE_URL || `http://127.0.0.1:${process.env.VITE_DEV_PORT || 3190}`,
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || '',
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES || 30),
  uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
};
