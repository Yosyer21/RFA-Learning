async function up(query) {
  // Add avatar_url column to users (stores base64 data URL of profile photo)
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''
  `);
}

module.exports = { up };
