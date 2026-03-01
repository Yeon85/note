import mysql from 'mysql2/promise';
import { env } from './env.js';

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

const dbConfig = parseDatabaseUrl(env.databaseUrl);

export const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  charset: 'utf8mb4',
  connectionLimit: 10,
  waitForConnections: true,
  namedPlaceholders: true,
});

export async function runQuery(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
