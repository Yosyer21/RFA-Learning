const express = require('express');
const multer = require('multer');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const { asyncHandler } = require('../middleware/error.middleware');
const { validate, createUserSchema, updateUserSchema } = require('../utils/validators');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', asyncHandler(getUsers));
router.post('/', validate(createUserSchema), asyncHandler(createUser));
router.put('/:id', validate(updateUserSchema), asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

module.exports = router;
