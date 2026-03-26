const { readJson, writeJson, nextId } = require('../utils/db');
const { hashPassword } = require('../utils/hash');
const { normalizeText, publicUser } = require('../utils/helpers');

async function getUsers(_req, res) {
  const users = await readJson('users.json', []);
  return res.json(users.map(publicUser));
}

async function createUser(req, res) {
  const users = await readJson('users.json', []);

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

  if (users.some((user) => user.username.toLowerCase() === username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const newUser = {
    id: nextId(users),
    name,
    username,
    password: await hashPassword(password),
    role,
    active,
    mustChangePassword,
  };

  users.push(newUser);
  await writeJson('users.json', users);

  return res.status(201).json(publicUser(newUser));
}

async function updateUser(req, res) {
  const users = await readJson('users.json', []);
  const id = Number(req.params.id);
  const user = users.find((item) => item.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const name = normalizeText(req.body.name);
  const username = normalizeText(req.body.username).toLowerCase();
  const role = normalizeText(req.body.role).toLowerCase();

  if (name) user.name = name;
  if (username && users.some((item) => item.id !== user.id && item.username.toLowerCase() === username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  if (username) user.username = username;
  if (['admin', 'student'].includes(role)) user.role = role;
  if (typeof req.body.active === 'boolean') user.active = req.body.active;
  if (typeof req.body.mustChangePassword === 'boolean') {
    user.mustChangePassword = req.body.mustChangePassword;
  }

  if (normalizeText(req.body.password)) {
    user.password = await hashPassword(req.body.password);
  }

  await writeJson('users.json', users);
  return res.json(publicUser(user));
}

async function deleteUser(req, res) {
  const users = await readJson('users.json', []);
  const id = Number(req.params.id);
  const user = users.find((item) => item.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role === 'admin') {
    const admins = users.filter((item) => item.role === 'admin' && item.id !== user.id);
    if (!admins.length) {
      return res.status(400).json({ message: 'At least one admin must remain' });
    }
  }

  const filtered = users.filter((item) => item.id !== id);
  await writeJson('users.json', filtered);
  return res.json({ message: 'User deleted' });
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
