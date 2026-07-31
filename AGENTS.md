# AGENTS.md — Guía de contexto para agentes de IA

> **LEE ESTE ARCHIVO PRIMERO.** Contiene todo el contexto necesario para trabajar en este proyecto sin explorar archivos innecesariamente. Esto ahorra tokens y tiempo.

## 🎯 Qué es este proyecto
**RFA.Learning** — Plataforma web para aprender lenguaje de fútbol en español/inglés (Football Language System). Full-stack: Node.js/Express + PostgreSQL + HTML/CSS/JS vanilla.

## 🚀 Comandos rápidos (usa estos, no explores)
```bash
npm run dev        # Servidor en desarrollo (puerto 3000, DB embebida pg-mem)
npm start          # Servidor en producción (requiere DATABASE_URL)
npm test           # Suite de tests (Jest + Supertest)
npm run test:silent    # Tests sin verbose (más compacto)
npm run context        # Resumen del estado del proyecto (estructura, git, Railway, variables)
npm run index:functions # Índice de funciones de archivos grandes (localiza sin leer completo)
npm run seed:railway   # Sincroniza clases en BD de Railway
npm run seed:users     # Crea/verifica usuarios en BD de Railway
npm run deploy         # Despliega a Railway (push a master)
```


## 🏗️ Arquitectura (resumen)
```
server/
  app.js                 # Config Express, sesiones, seguridad, rutas estáticas
  controllers/           # auth, user, class, admin
  middleware/            # auth (requireAuth), role (requireRole), error, logger
  routes/                # auth, user, class, admin
  utils/
    db.js                # Pool pg (o pg-mem embebido si no hay DATABASE_URL)
    bootstrap.js         # Init tablas + migraciones + seed admin/user/clases
    init-db.js           # CREATE TABLE users/classes/progress/config
    migrator.js          # Sistema de migraciones (001-006)
    content.js           # Normalización de contenido de clases (ES/EN)
    football-classes.js  # Datos semilla de clases de fútbol
    registration-eligibility.js  # Validación de registro vía Google Sheets
    validators.js        # Schemas Zod
    helpers.js           # normalizeText, matchesTranslation, publicUser
    hash.js              # bcrypt
    logger.js            # Logger
  migrations/            # 001-006 (quizzes, seed, preferencias, avatar, created_at)
html/                    # Vistas: index, login, register, home, clases, profile, dashboard, change-password
js/                      # Scripts por vista + shared.js + i18n.js + theme.js
css/                     # Estilos (base, modern, shared, por vista)
scripts/                 # seed-classes-railway.js, seed-users-railway.js, seed-classes-railway.ps1
tests/                   # Jest tests
Database/                # Ejemplos y datos de referencia (clases.json, config.json)
```

## 🔐 Autenticación y roles
- Sesiones con `express-session` (store PostgreSQL o MemoryStore en dev).
- Roles: `admin` y `student`. Middleware `requireAuth` + `requireRole('admin')`.
- **Registro basado en órdenes**: solo correos "pagados" en Google Sheets (producto "Football Language System"). Si no hay config de Google Sheets, el registro queda deshabilitado.
- Usuario admin por defecto (dev): `admin` / `Admin1234`. Usuario estándar: `user` / `User1234`.

## 🗄️ Base de datos
- **Producción (Railway)**: PostgreSQL real vía `DATABASE_URL`.
- **Desarrollo local**: `pg-mem` (base embebida en memoria) si no hay `DATABASE_URL`. No requiere PostgreSQL instalado.
- Tablas: `users`, `classes`, `progress`, `config`, `quizzes`.
- Migraciones automáticas en bootstrap (`001`-`006`).

## 🌐 Railway (producción)
- Proyecto: **RFA-Learning** · Servicio: **RFA-App** · URL: https://rfa-learning.up.railway.app
- Repo vinculado: `Yosyer21/RFA-Learning` (rama `master`) — deploy automático en push.
- CLI: `railway` (autenticado). Comandos útiles: `railway status`, `railway logs`, `railway variables`, `railway deployment list`.
- Variables clave: `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_RANGE`, `DEFAULT_ADMIN_*`, `DEFAULT_USER_*`.

## 📦 Dependencias principales
`express@5`, `pg`, `pg-mem`, `express-session`, `connect-pg-simple`, `bcrypt`, `zod`, `helmet`, `cors`, `express-rate-limit`, `multer`, `dotenv`. Dev: `jest`, `supertest`, `@railway/cli`.

## ⚠️ Notas importantes para el agente
1. **`js/clases.js` es grande** (~1344 líneas): contiene modos de práctica (estudio, flashcards, escritura, quiz MCQ), síntesis de voz, favoritos, mastery. No lo leas completo salvo que la tarea lo requiera. Usa `npm run index:functions` para localizar funciones.
2. **`js/i18n.js` es grande** (~1094 líneas): diccionario ES/EN (~450 claves por idioma). Solo lee las claves relevantes a tu tarea.
3. **`server/utils/registration-eligibility.js`** (~562 líneas): integración Google Sheets con JWT OAuth2. Solo lee si trabajas en registro/pagos.
4. **`server/controllers/class.controller.js`** (~653 líneas): lógica de clases, quizzes, progreso, logros, streak, SRS. El endpoint `getHomeData` es el más complejo.
5. **Duplicación intencional**: `buildExamplePair` y `normalizeKey` existen en `server/utils/content.js` (backend) y `js/clases.js` (frontend). No los "arregles" sin consultar.
6. **`username` se usa como email** en el registro (el usuario se registra con su correo).
7. **No expongas secretos**: `SESSION_SECRET`, `DATABASE_URL`, `GOOGLE_SERVICE_ACCOUNT_JSON` son sensibles. No los imprimas en logs ni los incluyas en respuestas.
8. **Shell es PowerShell** en Windows: usa `;` en vez de `&&` para encadenar comandos.
9. **El proyecto está en producción** en Railway. Cambios en `master` se despliegan automáticamente. Ten cuidado con cambios que rompan el deploy.
10. **Refactorización de archivos grandes**: `js/clases.js` y `js/i18n.js` son candidatos a dividirse en módulos, pero es un cambio de alto riesgo en producción. No lo hagas sin una tarea específica y sin correr `npm test` + verificar el deploy.


## ✅ Flujo de trabajo recomendado
1. Lee este `AGENTS.md` (ya lo estás haciendo).
2. Ejecuta `npm run context` para ver el estado actual (estructura, git, Railway) sin explorar.
3. Lee SOLO los archivos relevantes a la tarea (usa `search_files` para localizar funciones específicas).
4. Haz cambios mínimos y enfocados.
5. Corre `npm test` antes de terminar.
6. Si es un cambio de producción, verifica con `railway status` y `railway logs`.
