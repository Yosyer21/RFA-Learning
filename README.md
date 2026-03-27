# RFA.Learning

Plataforma web para aprender lenguaje del futbol en ingles y espanol.

## Stack
- Node.js + Express
- PostgreSQL + `pg`
- express-session con store en PostgreSQL
- bcrypt
- HTML/CSS/JS vanilla
- Zod para validacion
- `helmet`, `cors` y rate limiting

## Estructura
- `html/`: vistas
- `js/`: scripts por vista
- `css/style.css`: estilos globales
- `Database/`: ejemplos y datos de referencia
- `server/`: backend modular (routes/controllers/middleware/utils)

## Ejecutar
```bash
npm install
npm run start
```

Abrir `http://localhost:3000`.

## Variables de entorno
- `DATABASE_URL`: cadena de conexiÃ³n a PostgreSQL
- `SESSION_SECRET`: secreto para cookies de sesiÃ³n
- `CORS_ORIGIN`: lista separada por comas de orÃ­genes permitidos
- `PORT`: puerto opcional
- `DEFAULT_ADMIN_USERNAME`: usuario inicial de administrador
- `DEFAULT_ADMIN_PASSWORD`: contraseÃ±a inicial de administrador
- `DEFAULT_ADMIN_NAME`: nombre del administrador inicial
- `DEFAULT_ADMIN_FORCE_PASSWORD_CHANGE`: `true` o `false`

Si no defines credenciales iniciales de admin en producciÃ³n, el bootstrap omite ese usuario por seguridad.

## Usuario inicial
- En desarrollo, si no configuras `DEFAULT_ADMIN_USERNAME` y `DEFAULT_ADMIN_PASSWORD`, se crea un admin temporal con:
  - user: `admin`
  - pass: `Admin1234`
- En el primer ingreso puede forzarse el cambio de contraseÃ±a.

## Rutas API principales
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET/POST/PUT/DELETE /api/users` (admin)
- `GET/POST/PUT/DELETE /api/classes` (lectura autenticada, CRUD admin)
- `GET/POST /api/classes/progress`
- `GET /api/admin/stats` (admin)
- `GET /api/auth/seed-status` (admin)
