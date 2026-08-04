require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');


const { requestLogger } = require('./middleware/logger.middleware');
const { requireAuth } = require('./middleware/auth.middleware');
const { requireRole } = require('./middleware/role.middleware');
const { errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const classRoutes = require('./routes/class.routes');
const adminRoutes = require('./routes/admin.routes');
const classroomRoutes = require('./routes/classroom.routes');
const publicRoutes = require('./routes/public.routes');

const { bootstrapDatabase } = require('./utils/bootstrap');
const { pool, isEmbeddedDatabase } = require('./utils/db');
const { log } = require('./utils/logger');

function getAllowedOrigins() {
  return String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createApp({ sessionSecret } = {}) {
  const app = express();
  const allowedOrigins = getAllowedOrigins();
  const sessionStore = isEmbeddedDatabase
    ? new session.MemoryStore()
    : new PgSession({
        pool,
        createTableIfMissing: true,
      });

  app.disable('x-powered-by');
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://meet.jit.si'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://meet.jit.si'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://meet.jit.si'],
        connectSrc: ["'self'", 'https://meet.jit.si', 'wss://meet.jit.si', 'https://*.jit.si', 'wss://*.jit.si'],
        fontSrc: ["'self'", 'data:', 'https://meet.jit.si'],
        mediaSrc: ["'self'", 'blob:', 'https://meet.jit.si'],
        workerSrc: ["'self'", 'blob:', 'https://meet.jit.si'],
        frameSrc: ["'self'", 'https://meet.jit.si'],
        childSrc: ["'self'", 'https://meet.jit.si'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
  }));

  app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas solicitudes, intenta más tarde' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos de autenticación, intenta más tarde' },
  });

  // Límite generoso para /api/auth/me: se llama en cada carga de página
  // (desde el script de la vista y desde mobile-nav), por lo que un límite
  // estricto provoca respuestas 429 y hace que las aulas "aparezcan y
  // desaparezcan" de forma inconsistente.
  const meLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas solicitudes, intenta más tarde' },
  });

  app.use(requestLogger);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use(
    session({
      name: 'rfa.sid',
      secret: sessionSecret || process.env.SESSION_SECRET || 'rfa-learning-dev-secret-change-this',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use('/css', express.static(path.join(__dirname, '..', 'css')));
  app.use('/js', express.static(path.join(__dirname, '..', 'js')));
  app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Directorio de archivos subidos (adjuntos de aulas)
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));


  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'index.html'));
  });


  app.get('/login', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'login.html'));
  });

  app.get('/register', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'register.html'));
  });

  app.get('/home', requireAuth, (req, res) => {
    if (req.user.role === 'teacher') {
      return res.redirect('/teacher-home');
    }
    res.sendFile(path.join(__dirname, '..', 'html', 'home.html'));
  });


  app.get('/teacher-home', requireAuth, requireRole('teacher'), (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'teacher-home.html'));
  });


  app.get('/change-password', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'change-password.html'));
  });

  app.get('/profile', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'profile.html'));
  });

  app.get('/dashboard', requireAuth, requireRole('admin'), (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'dashboard.html'));
  });

  app.get('/clases', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'clases.html'));
  });

  app.get('/classrooms', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'classrooms.html'));
  });

  app.get('/classroom/:id', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'classroom.html'));
  });
  // Página dedicada de videollamada (Jitsi Meet) de un aula
  app.get('/meeting/:id', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'meeting.html'));
  });

  // Vista pública del perfil (no requiere autenticación)
  app.get('/u/:username', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'public-profile.html'));
  });


  // /api/auth/me se llama en cada carga de página (varias veces), por lo que
  // usa un límite generoso. El resto de rutas de auth (login, register,
  // change-password) mantienen el límite estricto anti fuerza bruta.
  app.use('/api/auth/me', meLimiter, requireAuth, (req, res, next) => {
    // Re-enrutar al controlador 'me' de authRoutes
    const { me } = require('./controllers/auth.controller');
    me(req, res, next);
  });
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', apiLimiter, requireAuth, requireRole('admin'), userRoutes);
  app.use('/api/classes', apiLimiter, requireAuth, classRoutes);
  app.use('/api/admin', apiLimiter, requireAuth, requireRole('admin'), adminRoutes);
  app.use('/api/classrooms', apiLimiter, requireAuth, classroomRoutes);
  // Endpoints públicos (sin autenticación): perfil público, etc.
  app.use('/api/public', apiLimiter, publicRoutes);


  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}

async function startServer() {
  const config = await bootstrapDatabase();
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = process.env.SESSION_SECRET || (!isProduction ? config.sessionSecret : '');

  if (isProduction && !sessionSecret) {
    throw new Error('SESSION_SECRET is required in production');
  }

  const app = createApp({ sessionSecret });
  const PORT = Number(process.env.PORT || config.port || 3000);
  const HOST = '0.0.0.0';

  const server = app.listen(PORT, HOST, () => {
    log.info('Server started', { host: HOST, port: PORT });
  });

  const shutdown = async (signal) => {
    log.info(`${signal} received, shutting down`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  startServer().catch((error) => {
    log.error('Failed to start server', { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  createApp,
  startServer,
};
