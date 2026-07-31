async function up(query) {
  // Add created_at column to users for sorting/filtering by creation date
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
  `);
}

module.exports = { up };
