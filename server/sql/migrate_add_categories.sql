CREATE TABLE IF NOT EXISTS note_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(60) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_note_categories_user_name (user_id, name),
  INDEX idx_note_categories_user_id (user_id),
  CONSTRAINT fk_note_categories_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE notes
  ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER user_id;

CREATE INDEX idx_notes_category_id ON notes(category_id);

ALTER TABLE notes
  ADD CONSTRAINT fk_notes_category
    FOREIGN KEY (category_id) REFERENCES note_categories(id)
    ON DELETE SET NULL;

