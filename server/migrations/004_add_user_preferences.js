async function up(query) {
  // Add bio, avatar_color, preferred_voice, preferred_theme columns to users
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#6c5ce7',
    ADD COLUMN IF NOT EXISTS preferred_voice TEXT DEFAULT 'english',
    ADD COLUMN IF NOT EXISTS preferred_theme TEXT DEFAULT 'dark'
  `);
}

module.exports = { up };
