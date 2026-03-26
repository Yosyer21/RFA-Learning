function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (
    req.session.user.mustChangePassword &&
    req.path !== '/change-password' &&
    req.originalUrl !== '/change-password' &&
    req.originalUrl !== '/api/auth/change-password' &&
    req.originalUrl !== '/api/auth/logout' &&
    req.originalUrl !== '/api/auth/me'
  ) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(403).json({ message: 'Password update required', code: 'PASSWORD_UPDATE_REQUIRED' });
    }
    return res.redirect('/change-password');
  }

  req.user = req.session.user;
  return next();
}

module.exports = {
  requireAuth,
};
