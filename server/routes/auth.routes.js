const express = require('express');
const { login, logout, me, changePassword, seedStatus } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.post('/change-password', requireAuth, changePassword);
router.get('/seed-status', seedStatus);

module.exports = router;
