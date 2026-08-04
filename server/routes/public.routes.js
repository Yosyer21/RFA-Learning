const express = require('express');
const { getPublicProfile } = require('../controllers/public.controller');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// Endpoint público: perfil de usuario (sin autenticación)
router.get('/profile/:username', asyncHandler(getPublicProfile));

module.exports = router;
