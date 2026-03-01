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

async function main() {
  const dbConfig = parseDatabaseUrl(env.databaseUrl);
  const migrationPath = path.resolve(process.cwd(), 'sql', 'migrate_agree_columns.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    // eslint-disable-next-line no-console
    console.log('users agree_privacy/agree_terms/agree_marketing migration completed.');
  } catch (error) {
    if (error?.code === 'ER_DUP_FIELDNAME') {
      // eslint-disable-next-line no-console
      console.log('agree columns already exist. Skipping.');
    } else {
      throw error;
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
