const express = require('express');
const { dashboardStats, paidAccounts } = require('../controllers/admin.controller');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

router.get('/stats', asyncHandler(dashboardStats));
router.get('/paid-accounts', asyncHandler(paidAccounts));

module.exports = router;
