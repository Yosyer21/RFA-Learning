async function up(query) {
  // Tabla de invitaciones a aulas (profesor invita a un estudiante registrado)
  await query(`
    CREATE TABLE IF NOT EXISTS classroom_invitations (
      id SERIAL PRIMARY KEY,
      classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (classroom_id, user_id)
    );
  `);
}

module.exports = { up };
