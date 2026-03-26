const express = require('express');
const multer = require('multer');
const {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getProgress,
  updateProgress,
  importClassesCsv,
  submitQuiz,
  getQuizHistory,
} = require('../controllers/class.controller');
const { requireRole } = require('../middleware/role.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { validate, createClassSchema, updateClassSchema, progressSchema } = require('../utils/validators');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', asyncHandler(getClasses));
router.get('/progress', asyncHandler(getProgress));
router.post('/progress', validate(progressSchema), asyncHandler(updateProgress));

router.post('/quiz', asyncHandler(submitQuiz));
router.get('/quiz/history', asyncHandler(getQuizHistory));

router.post('/', requireRole('admin'), validate(createClassSchema), asyncHandler(createClass));
router.put('/:id', requireRole('admin'), validate(updateClassSchema), asyncHandler(updateClass));
router.delete('/:id', requireRole('admin'), asyncHandler(deleteClass));
router.post('/import-csv', requireRole('admin'), upload.single('file'), asyncHandler(importClassesCsv));

module.exports = router;
