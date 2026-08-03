const { query } = require('./db');
const { initDatabase } = require('./init-db');
const { hashPassword } = require('./hash');
const { runMigrations } = require('./migrator');
const { log } = require('./logger');
const { footballSeedClasses } = require('./football-classes');
const { enrichLessonContent } = require('./content');

async function ensureConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaults = {
    projectName: 'RFA.Learning',
    port: 3000,
    defaultLanguage: 'es',
    registrationEnabled: false,
    sessionSecret: isProduction ? '' : 'rfa-learning-dev-secret-change-this',
  };

  const result = await query('SELECT key, value FROM config');
  const existing = {};
  for (const row of result.rows) {
    existing[row.key] = row.value;
  }

  const config = { ...defaults, ...existing };

  for (const [key, value] of Object.entries(config)) {
    await query(
      `INSERT INTO config (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, JSON.stringify(value)]
    );
  }

  return config;
}

async function ensureUsers() {
  const isProduction = process.env.NODE_ENV === 'production';

  // ── Admin user ──
  const adminUsername = (process.env.DEFAULT_ADMIN_USERNAME || 'admin').toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || (isProduction ? '' : 'Admin1234');
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin';
  const forcePasswordChange = String(process.env.DEFAULT_ADMIN_FORCE_PASSWORD_CHANGE || 'true') !== 'false';

  if (adminUsername && adminPassword) {
    const hashedAdmin = await hashPassword(adminPassword);
    const adminResult = await query('SELECT id FROM users WHERE LOWER(username) = $1 LIMIT 1', [adminUsername]);
    if (adminResult.rows.length === 0) {
      await query(
        `INSERT INTO users (name, username, password, role, active, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [adminName, adminUsername, hashedAdmin, 'admin', true, forcePasswordChange]
      );
      console.log(`[BOOTSTRAP] Admin user created: ${adminUsername} / ${adminPassword}`);
      log.info('Default admin user created', {
        username: adminUsername,
        mustChangePassword: forcePasswordChange,
      });
    } else {
      // Update password to ensure it matches the configured one
      await query(
        'UPDATE users SET password = $1, name = $2, role = $3, active = $4, must_change_password = $5 WHERE LOWER(username) = $6',
        [hashedAdmin, adminName, 'admin', true, forcePasswordChange, adminUsername]
      );
      console.log(`[BOOTSTRAP] Admin user updated (username=${adminUsername})`);
    }
  } else {
    log.warn('Skipping default admin seed because credentials were not configured');
  }

  // ── Standard test user ──
  const userUsername = (process.env.DEFAULT_USER_USERNAME || 'user').toLowerCase();
  const userPassword = process.env.DEFAULT_USER_PASSWORD || (isProduction ? '' : 'User1234');
  const userName = process.env.DEFAULT_USER_NAME || 'Usuario';

  if (userUsername && userPassword) {
    const hashedUser = await hashPassword(userPassword);
    const userResult = await query(
      'SELECT id FROM users WHERE LOWER(username) = $1 LIMIT 1',
      [userUsername]
    );
    if (userResult.rows.length === 0) {
      await query(
        `INSERT INTO users (name, username, password, role, active, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userName, userUsername, hashedUser, 'student', true, false]
      );
      console.log(`[BOOTSTRAP] Standard user created: ${userUsername} / ${userPassword}`);
      log.info('Default standard user created', {
        username: userUsername,
      });
    } else {
      // Update password to ensure it matches the configured one
      await query(
        'UPDATE users SET password = $1, name = $2, role = $3, active = $4 WHERE LOWER(username) = $5',
        [hashedUser, userName, 'student', true, userUsername]
      );
      console.log(`[BOOTSTRAP] Standard user updated (username=${userUsername})`);
    }
  } else {
    log.warn('Skipping default user seed because credentials were not configured');
  }

  // ── Teacher test user ──
  const teacherUsername = (process.env.DEFAULT_TEACHER_USERNAME || 'teacher').toLowerCase();
  const teacherPassword = process.env.DEFAULT_TEACHER_PASSWORD || (isProduction ? '' : 'Teacher1234');
  const teacherName = process.env.DEFAULT_TEACHER_NAME || 'Profesor';

  if (teacherUsername && teacherPassword) {
    const hashedTeacher = await hashPassword(teacherPassword);
    const teacherResult = await query(
      'SELECT id FROM users WHERE LOWER(username) = $1 LIMIT 1',
      [teacherUsername]
    );
    if (teacherResult.rows.length === 0) {
      await query(
        `INSERT INTO users (name, username, password, role, active, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [teacherName, teacherUsername, hashedTeacher, 'teacher', true, false]
      );
      console.log(`[BOOTSTRAP] Teacher user created: ${teacherUsername} / ${teacherPassword}`);
      log.info('Default teacher user created', {
        username: teacherUsername,
      });
    } else {
      // Update password to ensure it matches the configured one
      await query(
        'UPDATE users SET password = $1, name = $2, role = $3, active = $4 WHERE LOWER(username) = $5',
        [hashedTeacher, teacherName, 'teacher', true, teacherUsername]
      );
      console.log(`[BOOTSTRAP] Teacher user updated (username=${teacherUsername})`);
    }
  } else {
    log.warn('Skipping default teacher seed because credentials were not configured');
  }
}


async function ensureClasses() {
  const classesResult = await query('SELECT id, title, category, content FROM classes ORDER BY id');
  const existingByTitle = {};
  for (const row of classesResult.rows) {
    existingByTitle[row.title] = row;
  }

  // Insertar clases nuevas que no existen por título
  for (const lesson of footballSeedClasses) {
    const enriched = enrichLessonContent(lesson);
    const contentJson = JSON.stringify(enriched.content);

    if (!existingByTitle[lesson.title]) {
      await query(
        `INSERT INTO classes (title, category, level, content)
         VALUES ($1, $2, $3, $4)`,
        [enriched.title, enriched.category, enriched.level, contentJson]
      );
      console.log(`[BOOTSTRAP] Class created: ${enriched.title}`);
      log.info('Seed class created', { title: enriched.title });
    }
  }

  // Actualizar contenido de clases existentes
  for (const row of classesResult.rows) {
    if (!Array.isArray(row.content) || row.content.length === 0) {
      continue;
    }

    const enriched = enrichLessonContent({
      title: row.title,
      category: row.category,
      content: row.content,
    });

    const currentJson = JSON.stringify(row.content);
    const enrichedJson = JSON.stringify(enriched.content);

    if (currentJson !== enrichedJson) {
      await query('UPDATE classes SET content = $1 WHERE id = $2', [enrichedJson, row.id]);
    }
  }
}


async function bootstrapDatabase() {
  await initDatabase();
  await runMigrations();
  const config = await ensureConfig();
  await ensureUsers();
  await ensureClasses();
  log.info('Database bootstrap complete');
  return config;
}

module.exports = {
  bootstrapDatabase,
};
