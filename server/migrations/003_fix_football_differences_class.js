const { footballSeedClasses } = require('../utils/football-classes');

async function up(query) {
  const lesson = footballSeedClasses.find(
    (item) => item.title === 'Lenguaje del Comentarista y Diferencias Clave'
  );

  if (!lesson) {
    return;
  }

  await query(
    `UPDATE classes
     SET title = $1, category = $2, level = $3, content = $4
     WHERE title = $5`,
    [lesson.title, lesson.category, lesson.level, JSON.stringify(lesson.content), 'Lenguaje del Comentarista y Jugadas Clave']
  );
}

module.exports = { up };
