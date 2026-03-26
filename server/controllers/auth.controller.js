const { readJson, writeJson } = require('../utils/db');
const { comparePassword, hashPassword } = require('../utils/hash');
const { normalizeText, publicUser } = require('../utils/helpers');

async function login(req, res) {
  const username = normalizeText(req.body.username).toLowerCase();
  const password = normalizeText(req.body.password);

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const users = await readJson('users.json', []);
  const user = users.find((item) => item.username.toLowerCase() === username);

  if (!user || !user.active) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    mustChangePassword: Boolean(user.mustChangePassword),
  };

  return res.json({
    message: 'Login successful',
    user: req.session.user,
  });
}

async function changePassword(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const currentPassword = normalizeText(req.body.currentPassword);
  const newPassword = normalizeText(req.body.newPassword);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must have at least 8 characters' });
  }

  const users = await readJson('users.json', []);
  const user = users.find((item) => item.id === req.session.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await writeJson('users.json', users);

  req.session.user.mustChangePassword = false;
  return res.json({ message: 'Password updated' });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('rfa.sid');
    res.json({ message: 'Logout successful' });
  });
}

function me(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.json({ user: req.session.user });
}

async function seedStatus(_req, res) {
  const users = await readJson('users.json', []);
  res.json({
    users: users.map(publicUser),
    hasAdmin: users.some((user) => user.role === 'admin'),
  });
}

module.exports = {
  login,
  logout,
  me,
  changePassword,
  seedStatus,
};
