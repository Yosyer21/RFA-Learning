const { query } = require('./db');
const { log } = require('./logger');
const fs = require('fs');
const path = require('path');

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations() {
  const result = await query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((r) => r.name);
}

async function runMigrations() {
  await ensureMigrationsTable();

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    log.info('No migrations directory found, skipping');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.js')).sort();
  const applied = await getAppliedMigrations();

  for (const file of files) {
    if (applied.includes(file)) continue;

    log.info(`Running migration: ${file}`);
    const migration = require(path.join(migrationsDir, file));
    await migration.up(query);
    await query('INSERT INTO migrations (name) VALUES ($1)', [file]);
    log.info(`Migration applied: ${file}`);
  }
}

module.exports = { runMigrations };
