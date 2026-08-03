async function up(query) {
  // Tabla de aulas (classrooms) creadas por profesores
  await query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Tabla de estudiantes inscritos en aulas
  await query(`
    CREATE TABLE IF NOT EXISTS classroom_members (
      id SERIAL PRIMARY KEY,
      classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (classroom_id, user_id)
    );
  `);
}

module.exports = { up };
