async function up(query) {
  await query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      answers JSONB NOT NULL DEFAULT '[]',
      completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(class_id, user_id, completed_at)
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_quizzes_class ON quizzes(class_id);
  `);
}

module.exports = { up };
