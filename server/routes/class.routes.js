const express = require('express');
const {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getProgress,
  updateProgress,
} = require('../controllers/class.controller');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/', getClasses);
router.get('/progress', getProgress);
router.post('/progress', updateProgress);

router.post('/', requireRole('admin'), createClass);
router.put('/:id', requireRole('admin'), updateClass);
router.delete('/:id', requireRole('admin'), deleteClass);

module.exports = router;
