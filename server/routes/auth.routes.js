const express = require('express');
const { login, logout, me, changePassword, seedStatus, register, updateProfile } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { validate, loginSchema, changePasswordSchema, registerSchema } = require('../utils/validators');

const router = express.Router();

router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/logout', logout);
router.get('/me', me);
router.post('/change-password', requireAuth, validate(changePasswordSchema), asyncHandler(changePassword));
router.put('/profile', requireAuth, asyncHandler(updateProfile));
router.get('/seed-status', asyncHandler(seedStatus));

module.exports = router;
