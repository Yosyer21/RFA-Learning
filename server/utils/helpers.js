function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function normalizeText(value = '') {
  return String(value).trim();
}

module.exports = {
  publicUser,
  normalizeText,
};
