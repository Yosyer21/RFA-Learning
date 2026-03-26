const path = require('path');
const express = require('express');
const session = require('express-session');

const { logger } = require('./middleware/logger.middleware');
const { requireAuth } = require('./middleware/auth.middleware');
const { requireRole } = require('./middleware/role.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const classRoutes = require('./routes/class.routes');
const adminRoutes = require('./routes/admin.routes');
const { bootstrapDatabase } = require('./utils/bootstrap');
const { pool } = require('./utils/db');

const app = express();

async function startServer() {
  const config = await bootstrapDatabase();
  const PORT = Number(process.env.PORT || config.port || 3000);

  app.use(logger);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      name: 'rfa.sid',
      secret: process.env.SESSION_SECRET || config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
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

  app.get('/home', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'home.html'));
  });

  app.get('/change-password', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'change-password.html'));
  });

  app.get('/dashboard', requireAuth, requireRole('admin'), (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'dashboard.html'));
  });

  app.get('/clases', requireAuth, (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'html', 'clases.html'));
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', requireAuth, requireRole('admin'), userRoutes);
  app.use('/api/classes', requireAuth, classRoutes);
  app.use('/api/admin', requireAuth, requireRole('admin'), adminRoutes);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.listen(PORT, () => {
    console.log(`RFA.Learning running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  pool.end();
  process.exit(0);
});
