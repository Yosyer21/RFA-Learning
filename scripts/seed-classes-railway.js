/**
 * Script para sincronizar las clases de fútbol en la BD de Railway.
 * Inserta las clases nuevas (que no existen por título) y actualiza
 * el contenido de las existentes para reflejar los términos más recientes.
 *
 * Uso: node scripts/seed-classes-railway.js
 * Requiere: DATABASE_URL en el entorno (Railway la provee automáticamente)
 *   - Local:  railway run node scripts/seed-classes-railway.js
 *   - Manual: set DATABASE_URL=... && node scripts/seed-classes-railway.js
 */

const { Pool } = require('pg');
const { footballSeedClasses } = require('../server/utils/football-classes');
const { enrichLessonContent } = require('../server/utils/content');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL no está definida. Ejecutar con: railway run node scripts/seed-classes-railway.js');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Verificar que la tabla classes exista
    const tableCheck = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'classes'
       )`
    );
    if (!tableCheck.rows[0].exists) {
      console.error('ERROR: La tabla "classes" no existe. Ejecuta primero el bootstrap del servidor.');
      process.exit(1);
    }

    // Obtener clases existentes
    const existingResult = await pool.query('SELECT id, title FROM classes ORDER BY id');
    const existingByTitle = {};
    existingResult.rows.forEach((row) => {
      existingByTitle[row.title] = row.id;
    });
    console.log(`Clases existentes en la BD: ${existingResult.rows.length}`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const lesson of footballSeedClasses) {
      const enriched = enrichLessonContent(lesson);
      const contentJson = JSON.stringify(enriched.content);

      const existingId = existingByTitle[lesson.title];

      if (!existingId) {
        // Insertar clase nueva
        await pool.query(
          `INSERT INTO classes (title, category, level, content)
           VALUES ($1, $2, $3, $4)`,
          [enriched.title, enriched.category, enriched.level, contentJson]
        );
        console.log(`  + INSERTADA: ${enriched.title} (${enriched.category} / ${enriched.level})`);
        inserted++;
      } else {
        // Actualizar contenido de clase existente
        const currentResult = await pool.query(
          'SELECT content FROM classes WHERE id = $1',
          [existingId]
        );
        const currentContent = currentResult.rows[0]?.content;
        const currentJson = JSON.stringify(currentContent);

        if (currentJson !== contentJson) {
          await pool.query(
            'UPDATE classes SET content = $1, category = $2, level = $3 WHERE id = $4',
            [contentJson, enriched.category, enriched.level, existingId]
          );
          console.log(`  ~ ACTUALIZADA: ${enriched.title} (${enriched.category} / ${enriched.level})`);
          updated++;
        } else {
          skipped++;
        }
      }
    }

    console.log('\nResumen:');
    console.log(`  - Insertadas: ${inserted}`);
    console.log(`  - Actualizadas: ${updated}`);
    console.log(`  - Sin cambios: ${skipped}`);

    // Mostrar total final
    const finalCount = await pool.query('SELECT COUNT(*) FROM classes');
    console.log(`\nTotal de clases en la BD: ${finalCount.rows[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
