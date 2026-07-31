# 🧠 PROMPT PARA AGENTES DE IA — RFA.Learning

> **Copia y pega este prompt al iniciar una sesión con cualquier agente de IA** (Claude, Cursor, Copilot, etc.) para que trabaje en este proyecto de forma eficiente y con el mínimo consumo de tokens.

---

## 📋 PROMPT (copia desde aquí)

```
Estás trabajando en el proyecto RFA.Learning (f:\Documentos\RFA-Learning), una plataforma web
para aprender lenguaje de fútbol en español/inglés. Stack: Node.js/Express + PostgreSQL +
HTML/CSS/JS vanilla. El proyecto está EN PRODUCCIÓN en Railway (https://rfa-learning.up.railway.app).

IMPORTANTE — SIGUE ESTE FLUJO PARA AHORRAR TOKENS:

1. LEE PRIMERO el archivo AGENTS.md en la raíz del proyecto. Contiene TODO el contexto
   necesario (arquitectura, autenticación, base de datos, Railway, notas importantes).
   NO explores archivos innecesariamente.

2. Ejecuta `npm run context` para ver el estado actual del proyecto en un solo comando:
   estructura de archivos, estado git, estado Railway y variables (sin secretos).

3. Para localizar funciones en archivos grandes (js/clases.js, js/i18n.js, etc.) usa
   `npm run index:functions` — te da el índice de funciones con número de línea SIN
   leer el archivo completo.

4. Lee SOLO los archivos relevantes a la tarea. Usa search_files para localizar
   funciones específicas en lugar de leer archivos completos.

5. Haz cambios mínimos y enfocados. NO refactorices archivos grandes sin tarea específica.

6. Antes de terminar, corre `npm test` (o `npm run test:silent` para salida compacta)
   para verificar que todo sigue funcionando.

7. Si es un cambio de producción, verifica con `railway status` y `railway logs`.

REGLAS CRÍTICAS:
- NO expongas secretos: SESSION_SECRET, DATABASE_URL, GOOGLE_SERVICE_ACCOUNT_JSON.
- Shell es PowerShell en Windows: usa `;` en vez de `&&` para encadenar comandos.
- El proyecto está en producción. Cambios en master se despliegan automáticamente.
- `username` se usa como email en el registro.
- `buildExamplePair` y `normalizeKey` están duplicados intencionalmente (backend y frontend).
- No leas js/clases.js (~1344 líneas) ni js/i18n.js (~1094 líneas) completos salvo que sea
  estrictamente necesario. Usa `npm run index:functions` primero.

COMANDOS ÚTILES:
- npm run dev          → servidor en desarrollo (puerto 3000, DB embebida pg-mem)
- npm start            → servidor en producción (requiere DATABASE_URL)
- npm test             → suite de tests
- npm run test:silent  → tests sin verbose
- npm run context      → resumen del estado del proyecto
- npm run index:functions → índice de funciones de archivos grandes
- npm run seed:railway → sincroniza clases en BD de Railway
- npm run seed:users   → crea/verifica usuarios en BD de Railway
- npm run deploy       → despliega a Railway (push a master)
```

---

## 💡 Cómo usarlo

1. **Copia** el bloque de código de arriba (desde `Estás trabajando en el proyecto...` hasta el final).
2. **Pégalo** como primer mensaje al agente de IA.
3. El agente leerá `AGENTS.md`, ejecutará `npm run context` y trabajará de forma eficiente.

## 📁 Archivos de referencia en el proyecto

| Archivo | Propósito |
|---------|-----------|
| `AGENTS.md` | Contexto completo del proyecto (el agente lo lee primero) |
| `scripts/context.js` | Genera resumen del estado (estructura, git, Railway) |
| `scripts/index-functions.js` | Índice de funciones de archivos grandes |
| `README.md` | Documentación general y comandos |
| `package.json` | Scripts de automatización |

## 🔄 Si el agente no respeta el flujo

Si el agente empieza a explorar archivos innecesariamente o lee archivos grandes completos,
recuérdale: *"Lee AGENTS.md primero y usa `npm run context` y `npm run index:functions` para ahorrar tokens."*
