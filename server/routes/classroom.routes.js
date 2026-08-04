const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
  getMeeting,
  getClassroom,
  createPost,
  listPosts,
  createAssignment,
  listAssignments,
  submitAssignment,
  listSubmissions,
  gradeSubmission,
  createComment,
  listComments,
  recordMeeting,
  listMeetings,
  updatePresence,
  uploadAttachment,
  listNotifications,
  getUnreadCount,
  markNotificationsRead,
  getCalendar,
} = require('../controllers/classroom.controller');
const { requireRole } = require('../middleware/role.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// ── Configuración de subida de archivos (adjuntos) ──
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Notificaciones (usuario autenticado) ──
router.get('/notifications', requireAuth, asyncHandler(listNotifications));
router.get('/notifications/unread-count', requireAuth, asyncHandler(getUnreadCount));
router.post('/notifications/read', requireAuth, asyncHandler(markNotificationsRead));

// ── Calendario de tareas ──
router.get('/calendar', requireAuth, asyncHandler(getCalendar));

// ── Subida de archivos ──
router.post('/upload', requireAuth, upload.single('file'), asyncHandler(uploadAttachment));

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
router.get('/:id/meeting', requireAuth, asyncHandler(getMeeting));
router.post('/:id/meeting/start', requireAuth, asyncHandler(recordMeeting));
router.get('/:id/meetings', requireAuth, asyncHandler(listMeetings));
router.post('/:id/presence', requireAuth, asyncHandler(updatePresence));
router.get('/:id/posts', requireAuth, asyncHandler(listPosts));
router.post('/:id/posts', requireAuth, asyncHandler(createPost));
router.get('/:id/assignments', requireAuth, asyncHandler(listAssignments));
router.post('/:id/assignments', requireAuth, asyncHandler(createAssignment));

// ── Comentarios de publicaciones ──
router.get('/posts/:postId/comments', requireAuth, asyncHandler(listComments));
router.post('/posts/:postId/comments', requireAuth, asyncHandler(createComment));

// ── Entregas de tareas ──
router.post('/assignments/:id/submit', requireAuth, asyncHandler(submitAssignment));
router.get('/assignments/:id/submissions', requireAuth, asyncHandler(listSubmissions));
router.post('/submissions/:id/grade', requireAuth, asyncHandler(gradeSubmission));

module.exports = router;
