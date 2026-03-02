import { runQuery } from '../config/db.js';

function isIgnorableMigrationError(error) {
  return new Set([
    'ER_TABLE_EXISTS_ERROR', // table exists
    'ER_DUP_FIELDNAME', // column exists
    'ER_DUP_KEYNAME', // index exists
    'ER_FK_DUP_NAME', // FK exists
  ]).has(error?.code);
}

async function execStmt(sql) {
  try {
    await runQuery(sql);
  } catch (error) {
    if (isIgnorableMigrationError(error)) return;
    throw error;
  }
}

export async function ensureCategoriesSchema() {
  // Create categories table
  await execStmt(
    `CREATE TABLE IF NOT EXISTS note_categories (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(60) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_note_categories_user_name (user_id, name),
      INDEX idx_note_categories_user_id (user_id),
      CONSTRAINT fk_note_categories_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  // Add notes.category_id (ignore if already there)
  await execStmt('ALTER TABLE notes ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER user_id');

  // Index (ignore if already there)
  await execStmt('CREATE INDEX idx_notes_category_id ON notes(category_id)');

  // FK (ignore if already there)
  await execStmt(
    `ALTER TABLE notes
     ADD CONSTRAINT fk_notes_category
       FOREIGN KEY (category_id) REFERENCES note_categories(id)
       ON DELETE SET NULL`,
  );
}

