const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { requestLogger } = require('./middleware/logger.middleware');
const { requireAuth } = require('./middleware/auth.middleware');
const { requireRole } = require('./middleware/role.middleware');
const { errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const classRoutes = require('./routes/class.routes');
const adminRoutes = require('./routes/admin.routes');
const { bootstrapDatabase } = require('./utils/bootstrap');
const { pool } = require('./utils/db');
const { log } = require('./utils/logger');

const app = express();
app.set('trust proxy', 1);

async function startServer() {
  const config = await bootstrapDatabase();
  const PORT = Number(process.env.PORT || config.port || 3000);

  // Security headers
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  }));

  // Rate limiting
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

  app.use(requestLogger);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      name: 'rfa.sid',
      secret: process.env.SESSION_SECRET || config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: new PgSession({
        pool,
        createTableIfMissing: true,
      }),
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

  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'index.html'));
  });

  app.get('/login', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'login.html'));
  });

  app.get('/register', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'register.html'));
  });

  app.get('/home', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'home.html'));
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

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', apiLimiter, requireAuth, requireRole('admin'), userRoutes);
  app.use('/api/classes', apiLimiter, requireAuth, classRoutes);
  app.use('/api/admin', apiLimiter, requireAuth, requireRole('admin'), adminRoutes);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.use(errorHandler);

  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    log.info('Server started', { host: HOST, port: PORT });
  });
}

startServer().catch((error) => {
  log.error('Failed to start server', { error: error.message });
  process.exit(1);
});

process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down');
  pool.end();
  process.exit(0);
});
