async function up(query) {
  // Adjuntos en publicaciones del muro
  await query(`
    ALTER TABLE classroom_posts
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_name TEXT;
  `);

  // Adjuntos en tareas
  await query(`
    ALTER TABLE classroom_assignments
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_name TEXT;
  `);

  // Calificación y retroalimentación en entregas de tareas
  await query(`
    ALTER TABLE assignment_submissions
      ADD COLUMN IF NOT EXISTS grade NUMERIC(5,2),
      ADD COLUMN IF NOT EXISTS feedback TEXT,
      ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
  `);

  // Comentarios en publicaciones del muro
  await query(`
    CREATE TABLE IF NOT EXISTS classroom_post_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES classroom_posts(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Historial de reuniones (videollamadas) del aula
  await query(`
    CREATE TABLE IF NOT EXISTS classroom_meetings (
      id SERIAL PRIMARY KEY,
      classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
      started_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Notificaciones de usuario
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Última actividad del miembro (para indicador de presencia)
  await query(`
    ALTER TABLE classroom_members
      ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
  `);
}

module.exports = { up };
