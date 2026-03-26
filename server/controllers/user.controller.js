const { query } = require('../utils/db');
const { hashPassword } = require('../utils/hash');
const { normalizeText, publicUser } = require('../utils/helpers');

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

async function getUsers(_req, res) {
  const result = await query('SELECT id, name, username, role, active, must_change_password FROM users ORDER BY id');
  return res.json(result.rows.map(mapUser).map(publicUser));
}

async function createUser(req, res) {
  const name = normalizeText(req.body.name);
  const username = normalizeText(req.body.username).toLowerCase();
  const password = normalizeText(req.body.password);
  const role = normalizeText(req.body.role).toLowerCase() || 'student';
  const active = req.body.active !== false;
  const mustChangePassword = req.body.mustChangePassword === true;

  if (!name || !username || !password) {
    return res.status(400).json({ message: 'Name, username and password are required' });
  }

  if (!['admin', 'student'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const existing = await query('SELECT id FROM users WHERE LOWER(username) = $1', [username]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const hashedPassword = await hashPassword(password);
  const result = await query(
    'INSERT INTO users (name, username, password, role, active, must_change_password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, username, hashedPassword, role, active, mustChangePassword]
  );

  return res.status(201).json(publicUser(mapUser(result.rows[0])));
}

async function updateUser(req, res) {
  const id = Number(req.params.id);

  const existing = await query('SELECT * FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = existing.rows[0];
  const name = normalizeText(req.body.name) || user.name;
  const username = normalizeText(req.body.username).toLowerCase() || user.username;
  const role = normalizeText(req.body.role).toLowerCase();
  const finalRole = ['admin', 'student'].includes(role) ? role : user.role;
  const active = typeof req.body.active === 'boolean' ? req.body.active : user.active;
  const mustChangePassword = typeof req.body.mustChangePassword === 'boolean' ? req.body.mustChangePassword : user.must_change_password;

  if (username !== user.username) {
    const dup = await query('SELECT id FROM users WHERE LOWER(username) = $1 AND id != $2', [username, id]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }
  }

  let password = user.password;
  if (normalizeText(req.body.password)) {
    password = await hashPassword(req.body.password);
  }

  const result = await query(
    'UPDATE users SET name = $1, username = $2, password = $3, role = $4, active = $5, must_change_password = $6 WHERE id = $7 RETURNING *',
    [name, username, password, finalRole, active, mustChangePassword, id]
  );

  return res.json(publicUser(mapUser(result.rows[0])));
}

async function deleteUser(req, res) {
  const id = Number(req.params.id);

  const existing = await query('SELECT id, role FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = existing.rows[0];
  if (user.role === 'admin') {
    const admins = await query('SELECT id FROM users WHERE role = $1 AND id != $2', ['admin', id]);
    if (admins.rows.length === 0) {
      return res.status(400).json({ message: 'At least one admin must remain' });
    }
  }

  await query('DELETE FROM users WHERE id = $1', [id]);
  return res.json({ message: 'User deleted' });
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
