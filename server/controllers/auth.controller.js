const { query } = require('../utils/db');
const { comparePassword, hashPassword } = require('../utils/hash');
const { normalizeText } = require('../utils/helpers');

function regenerateSession(req, payload) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      req.session.user = payload;
      resolve();
    });
  });
}

async function login(req, res) {
  const { username, password } = req.body;

  const result = await query(
    'SELECT id, name, username, password, role, active, must_change_password FROM users WHERE LOWER(username) = $1',
    [username.toLowerCase()]
  );
  const user = result.rows[0];

  if (!user || !user.active) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    mustChangePassword: Boolean(user.must_change_password),
  };

  await regenerateSession(req, sessionUser);

  return res.json({
    message: 'Login exitoso',
    user: sessionUser,
  });
}

async function register(req, res) {
  const { name, username, password } = req.body;

  // Check if registration is enabled
  const configResult = await query("SELECT value FROM config WHERE key = 'registrationEnabled'");
  const registrationEnabled = configResult.rows[0]?.value === true;
  if (!registrationEnabled) {
    return res.status(403).json({ message: 'El registro no está habilitado' });
  }

  const existing = await query('SELECT id FROM users WHERE LOWER(username) = $1', [username.toLowerCase()]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'El nombre de usuario ya existe' });
  }

  const hashedPassword = await hashPassword(password);
  const result = await query(
    'INSERT INTO users (name, username, password, role, active, must_change_password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, role',
    [name, username.toLowerCase(), hashedPassword, 'student', true, false]
  );

  const newUser = result.rows[0];

  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    username: newUser.username,
    role: newUser.role,
    mustChangePassword: false,
  };

  await regenerateSession(req, sessionUser);

  return res.status(201).json({
    message: 'Registro exitoso',
    user: sessionUser,
  });
}

async function changePassword(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const { currentPassword, newPassword } = req.body;

  const result = await query('SELECT id, password FROM users WHERE id = $1', [req.session.user.id]);
  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
  }

  const hashedPassword = await hashPassword(newPassword);
  await query('UPDATE users SET password = $1, must_change_password = false WHERE id = $2', [hashedPassword, user.id]);

  req.session.user.mustChangePassword = false;
  return res.json({ message: 'Contraseña actualizada' });
}

async function updateProfile(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const name = normalizeText(req.body.name);
  if (!name) {
    return res.status(400).json({ message: 'Nombre requerido' });
  }

  await query('UPDATE users SET name = $1 WHERE id = $2', [name, req.session.user.id]);
  req.session.user.name = name;

  return res.json({ message: 'Perfil actualizado', user: req.session.user });
}

function logout(req, res) {
  req.session.destroy((error) => {
    res.clearCookie('rfa.sid');

    if (error) {
      res.status(500).json({ message: 'No se pudo cerrar la sesión' });
      return;
    }

    res.json({ message: 'Logout exitoso' });
  });
}

function me(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  return res.json({ user: req.session.user });
}

async function seedStatus(_req, res) {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total_users,
      COUNT(*) FILTER (WHERE role = 'admin')::int AS total_admins,
      COUNT(*) FILTER (WHERE role = 'student')::int AS total_students,
      COUNT(*) FILTER (WHERE active = true)::int AS active_users
    FROM users
  `);
  const summary = result.rows[0];

  res.json({
    totalUsers: summary.total_users,
    totalAdmins: summary.total_admins,
    totalStudents: summary.total_students,
    activeUsers: summary.active_users,
    hasAdmin: summary.total_admins > 0,
  });
}

module.exports = {
  login,
  logout,
  me,
  changePassword,
  seedStatus,
  register,
  updateProfile,
};
