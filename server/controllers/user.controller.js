const { query } = require('../utils/db');
const { hashPassword } = require('../utils/hash');
const { publicUser } = require('../utils/helpers');

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    password: row.password,
    role: row.role,
    active: row.active,
    mustChangePassword: row.must_change_password,
  };
}

async function getUsers(req, res) {
  const { page, limit } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * pageSize;

  const countResult = await query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query(
    'SELECT id, name, username, role, active, must_change_password FROM users ORDER BY id LIMIT $1 OFFSET $2',
    [pageSize, offset]
  );

  return res.json({
    data: result.rows.map(mapUser).map(publicUser),
    pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
  });
}

async function createUser(req, res) {
  const { name, username, password, role, active, mustChangePassword } = req.body;

  const existing = await query('SELECT id FROM users WHERE LOWER(username) = $1', [username.toLowerCase()]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'El nombre de usuario ya existe' });
  }

  const hashedPassword = await hashPassword(password);
  const result = await query(
    'INSERT INTO users (name, username, password, role, active, must_change_password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, username.toLowerCase(), hashedPassword, role || 'student', active !== false, mustChangePassword === true]
  );

  return res.status(201).json(publicUser(mapUser(result.rows[0])));
}

async function updateUser(req, res) {
  const id = Number(req.params.id);

  const existing = await query('SELECT * FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const user = existing.rows[0];
  const name = req.body.name || user.name;
  const username = (req.body.username || user.username).toLowerCase();
  const role = req.body.role || user.role;
  const active = typeof req.body.active === 'boolean' ? req.body.active : user.active;
  const mustChangePassword = typeof req.body.mustChangePassword === 'boolean' ? req.body.mustChangePassword : user.must_change_password;

  if (username !== user.username) {
    const dup = await query('SELECT id FROM users WHERE LOWER(username) = $1 AND id != $2', [username, id]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe' });
    }
  }

  let password = user.password;
  if (req.body.password) {
    password = await hashPassword(req.body.password);
  }

  const result = await query(
    'UPDATE users SET name = $1, username = $2, password = $3, role = $4, active = $5, must_change_password = $6 WHERE id = $7 RETURNING *',
    [name, username, password, role, active, mustChangePassword, id]
  );

  return res.json(publicUser(mapUser(result.rows[0])));
}

async function deleteUser(req, res) {
  const id = Number(req.params.id);

  const existing = await query('SELECT id, role FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const user = existing.rows[0];
  if (user.role === 'admin') {
    const admins = await query('SELECT id FROM users WHERE role = $1 AND id != $2', ['admin', id]);
    if (admins.rows.length === 0) {
      return res.status(400).json({ message: 'Debe quedar al menos un administrador' });
    }
  }

  await query('DELETE FROM users WHERE id = $1', [id]);
  return res.json({ message: 'Usuario eliminado' });
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
