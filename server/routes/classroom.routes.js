const express = require('express');
const {
  listMyClassrooms,
  listMyJoinedClassrooms,
  createClassroom,
  searchStudents,
  inviteStudent,
  listMembers,
  removeMember,
  listMyInvitations,
  acceptInvitation,
  declineInvitation,
  getClassroom,
  createPost,
  listPosts,
  createAssignment,
  listAssignments,
  submitAssignment,
  listSubmissions,
} = require('../controllers/classroom.controller');
const { requireRole } = require('../middleware/role.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ── Rutas de profesor ──
router.get('/', requireRole('teacher'), asyncHandler(listMyClassrooms));
router.post('/', requireRole('teacher'), asyncHandler(createClassroom));
router.get('/search-students', requireRole('teacher'), asyncHandler(searchStudents));
router.get('/:id/members', requireRole('teacher'), asyncHandler(listMembers));
router.post('/:id/invite', requireRole('teacher'), asyncHandler(inviteStudent));
router.delete('/:id/members/:userId', requireRole('teacher'), asyncHandler(removeMember));

// ── Rutas de estudiante ──
router.get('/joined', requireRole('student'), asyncHandler(listMyJoinedClassrooms));
router.get('/invitations', requireRole('student'), asyncHandler(listMyInvitations));
router.post('/invitations/:id/accept', requireRole('student'), asyncHandler(acceptInvitation));
router.post('/invitations/:id/decline', requireRole('student'), asyncHandler(declineInvitation));

// ── Rutas compartidas (profesor o miembro) ──
router.get('/:id', requireAuth, asyncHandler(getClassroom));
router.get('/:id/posts', requireAuth, asyncHandler(listPosts));
router.post('/:id/posts', requireAuth, asyncHandler(createPost));
router.get('/:id/assignments', requireAuth, asyncHandler(listAssignments));
router.post('/:id/assignments', requireAuth, asyncHandler(createAssignment));

// ── Entregas de tareas ──
router.post('/assignments/:id/submit', requireAuth, asyncHandler(submitAssignment));
router.get('/assignments/:id/submissions', requireAuth, asyncHandler(listSubmissions));

module.exports = router;
