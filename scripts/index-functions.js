/**
 * Genera un índice de funciones/constantes de los archivos grandes del proyecto.
 * Permite a un agente localizar funciones específicas sin leer archivos completos.
 *
 * Uso: node scripts/index-functions.js [archivo...]
 * Ejemplo: node scripts/index-functions.js js/clases.js js/i18n.js
 */
const fs = require('fs');
const path = require('path');

// Archivos grandes por defecto (los que AGENTS.md recomienda no leer completos)
const DEFAULT_FILES = [
  'js/clases.js',
  'js/i18n.js',
  'server/controllers/class.controller.js',
  'server/utils/registration-eligibility.js',
  'server/utils/content.js',
  'server/utils/football-classes.js',
];

const files = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_FILES;

// Patrones para detectar definiciones de funciones/constantes
const PATTERNS = [
  /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,          // function foo
  /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\(|=>)/, // const foo = ...
  /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/, // export function foo
  /^module\.exports\s*=\s*\{/,                              // module.exports
];

function indexFile(file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.log(`⚠️  No existe: ${file}`);
    return;
  }

  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  const defs = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    for (const pattern of PATTERNS) {
      const m = trimmed.match(pattern);
      if (m && m[1]) {
        defs.push({ name: m[1], line: i + 1 });
        break;
      }
    }
  });


  console.log(`\n📄 ${file} (${lines.length} líneas, ${defs.length} definiciones)`);
  if (defs.length === 0) {
    console.log('   (sin definiciones detectadas)');
    return;
  }

  // Agrupar por primera letra para facilitar búsqueda
  const grouped = {};
  defs.forEach((d) => {
    const key = d.name[0].toUpperCase();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });

  Object.keys(grouped).sort().forEach((key) => {
    console.log(`  ${key}:`);
    grouped[key].forEach((d) => {
      console.log(`    L${String(d.line).padStart(4)}  ${d.name}`);
    });
  });
}

console.log('=== ÍNDICE DE FUNCIONES ===');
files.forEach(indexFile);
console.log('\n✅ Índice generado. Usa `node scripts/index-functions.js <archivo>` para indexar un archivo específico.');
