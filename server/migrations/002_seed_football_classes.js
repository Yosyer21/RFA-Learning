const { footballSeedClasses } = require('../utils/football-classes');

async function up(query) {
  for (const lesson of footballSeedClasses) {
    const existing = await query('SELECT id FROM classes WHERE title = $1 LIMIT 1', [lesson.title]);
    if (existing.rows.length > 0) {
      continue;
    }

    await query(
      `INSERT INTO classes (title, category, level, content)
       VALUES ($1, $2, $3, $4)`,
      [lesson.title, lesson.category, lesson.level, JSON.stringify(lesson.content)]
    );
  }
}

module.exports = { up };
