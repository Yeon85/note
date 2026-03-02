import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

function parseDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  };
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map((stmt) => stmt.trim())
    .filter(Boolean);
}

function shouldIgnoreMysqlError(error) {
  return new Set([
    'ER_TABLE_EXISTS_ERROR',
    'ER_DUP_FIELDNAME',
    'ER_DUP_KEYNAME',
    'ER_FK_DUP_NAME',
  ]).has(error?.code);
}

async function main() {
  const dbConfig = parseDatabaseUrl(env.databaseUrl);
  const migrationPath = path.resolve(process.cwd(), 'sql', 'migrate_add_categories.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  const statements = splitSqlStatements(sql);

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    charset: 'utf8mb4',
    multipleStatements: false,
  });

  try {
    for (const stmt of statements) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await connection.query(stmt);
      } catch (error) {
        if (shouldIgnoreMysqlError(error)) {
          // eslint-disable-next-line no-console
          console.log(`Skipping (${error.code}): ${stmt.slice(0, 80)}...`);
          continue;
        }
        throw error;
      }
    }
    // eslint-disable-next-line no-console
    console.log('note_categories / notes.category_id migration completed.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

