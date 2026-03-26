const express = require('express');
const { dashboardStats } = require('../controllers/admin.controller');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

router.get('/stats', asyncHandler(dashboardStats));

module.exports = router;
