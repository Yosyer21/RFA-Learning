/**
 * Genera un resumen del estado del proyecto para agentes de IA.
 * Muestra: estructura, estado git, estado Railway y variables (sin secretos).
 *
 * Uso: npm run context
 */
const { execSync } = require('child_process');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '(no disponible)';
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

// ── 1. Estructura ──
section('ESTRUCTURA');
console.log(run('node -e "const fs=require(\'fs\');const p=require(\'path\');function walk(d,pre=\'\'){const items=fs.readdirSync(d,{withFileTypes:true}).filter(i=>!i.name.startsWith(\'.\')&&i.name!==\'node_modules\');items.forEach((i,idx)=>{const last=idx===items.length-1;console.log(pre+(last?\'└─\':\'├─\')+\' \'+i.name);if(i.isDirectory())walk(p.join(d,i.name),pre+(last?\'   \':\'│  \'))})}walk(\'.\')"'));

// ── 2. Git ──
section('GIT');
console.log('Branch:', run('git branch --show-current'));
console.log('Último commit:', run('git log -1 --oneline'));
console.log('Estado:', run('git status --short') || 'limpio');

// ── 3. Railway ──
section('RAILWAY');
const status = run('railway status');
// Mostrar solo líneas relevantes (sin exponer secretos)
console.log(status.split('\n').filter((l) =>
  /status|url|region|repo|Project|Environment|Service|Database|Online|Postgres/i.test(l)
).join('\n'));

// ── 4. Variables (solo nombres, sin valores) ──
section('VARIABLES RAILWAY (nombres)');
const varsJson = run('railway variables --json');
try {
  const varNames = Object.keys(JSON.parse(varsJson));
  console.log(varNames.join(', '));
} catch {
  console.log('(no se pudieron leer las variables)');
}



// ── 5. Tests ──
section('TESTS');
console.log(run('npm test -- --silent 2>&1'));


console.log('\n✅ Contexto generado. Usa `npm run context` para refrescar.');
