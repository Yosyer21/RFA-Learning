const { query } = require('./db');
const { initDatabase } = require('./init-db');
const { hashPassword } = require('./hash');
const { runMigrations } = require('./migrator');
const { log } = require('./logger');

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
    const hashedPassword = await hashPassword('Admin1234');
    await query(
      `INSERT INTO users (name, username, password, role, active, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['Admin', 'admin', hashedPassword, 'admin', true, true]
    );
    console.log('Default admin user created (admin / Admin1234)');
  }
}

async function ensureClasses() {
  const result = await query('SELECT COUNT(*) FROM classes');
  const count = parseInt(result.rows[0].count, 10);

  if (count === 0) {
    const content = JSON.stringify([
      { spanish: 'portero', english: 'goalkeeper' },
      { spanish: 'defensa', english: 'defender' },
      { spanish: 'mediocampista', english: 'midfielder' },
      { spanish: 'delantero', english: 'striker' },
    ]);

    await query(
      `INSERT INTO classes (title, category, level, content)
       VALUES ($1, $2, $3, $4)`,
      ['Basic Football Vocabulary', 'Vocabulary', 'Beginner', content]
    );
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
