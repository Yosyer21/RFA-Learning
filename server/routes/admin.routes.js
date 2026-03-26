const express = require('express');
const { dashboardStats } = require('../controllers/admin.controller');

const router = express.Router();

router.get('/stats', dashboardStats);

module.exports = router;
