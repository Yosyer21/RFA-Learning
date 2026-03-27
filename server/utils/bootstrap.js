const { query } = require('./db');
const { initDatabase } = require('./init-db');
const { hashPassword } = require('./hash');
const { runMigrations } = require('./migrator');
const { log } = require('./logger');
const { footballSeedClasses } = require('./football-classes');

async function ensureConfig() {
  const defaults = {
    projectName: 'RFA.Learning',
    port: 3000,
    defaultLanguage: 'es',
    registrationEnabled: false,
    sessionSecret: 'rfa-learning-dev-secret-change-this',
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
  const result = await query('SELECT COUNT(*) FROM users');
  const count = parseInt(result.rows[0].count, 10);

  if (count === 0) {
    const isProduction = process.env.NODE_ENV === 'production';
    const username = process.env.DEFAULT_ADMIN_USERNAME || (isProduction ? '' : 'admin');
    const password = process.env.DEFAULT_ADMIN_PASSWORD || (isProduction ? '' : 'Admin1234');
    const name = process.env.DEFAULT_ADMIN_NAME || 'Admin';
    const forcePasswordChange = String(process.env.DEFAULT_ADMIN_FORCE_PASSWORD_CHANGE || 'true') !== 'false';

    if (!username || !password) {
      log.warn('Skipping default admin seed because credentials were not configured');
      return;
    }

    const hashedPassword = await hashPassword(password);
    await query(
      `INSERT INTO users (name, username, password, role, active, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, username.toLowerCase(), hashedPassword, 'admin', true, forcePasswordChange]
    );
    log.info('Default admin user created', {
      username: username.toLowerCase(),
      mustChangePassword: forcePasswordChange,
    });
  }
}

async function ensureClasses() {
  const result = await query('SELECT COUNT(*) FROM classes');
  const count = parseInt(result.rows[0].count, 10);

  if (count === 0) {
    for (const lesson of footballSeedClasses) {
      await query(
        `INSERT INTO classes (title, category, level, content)
         VALUES ($1, $2, $3, $4)`,
        [lesson.title, lesson.category, lesson.level, JSON.stringify(lesson.content)]
      );
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
