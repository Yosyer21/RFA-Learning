# RFA.Learning

Plataforma web para aprender lenguaje del futbol en ingles y espanol.

## Stack
- Node.js + Express
- express-session
- bcrypt
- HTML/CSS/JS vanilla
- JSON local en `Database/`

## Estructura
- `html/`: vistas
- `js/`: scripts por vista
- `css/style.css`: estilos globales
- `Database/`: users, clases, progress, config
- `server/`: backend modular (routes/controllers/middleware/utils)

## Ejecutar
```bash
npm install
npm run start
```

Abrir `http://localhost:3000`.

## Usuario inicial
- user: `admin`
- pass: `Admin1234`
- primer ingreso: cambio obligatorio de contrasena en `/change-password`

## Rutas API principales
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET/POST/PUT/DELETE /api/users` (admin)
- `GET/POST/PUT/DELETE /api/classes` (lectura autenticada, CRUD admin)
- `GET/POST /api/classes/progress`
- `GET /api/admin/stats` (admin)
