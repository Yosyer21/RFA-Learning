const { query } = require('../utils/db');
const { publicUser } = require('../utils/helpers');

// Genera un código único corto para el aula (ej: ABC123)
function generateClassroomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Profesor: listar sus aulas ──
async function listMyClassrooms(req, res) {
  const teacherId = req.user.id;

  const result = await query(
    `SELECT c.id, c.name, c.description, c.code, c.created_at,
            COUNT(cm.id)::int AS member_count
     FROM classrooms c
     LEFT JOIN classroom_members cm ON cm.classroom_id = c.id
     WHERE c.teacher_id = $1
     GROUP BY c.id, c.name, c.description, c.code, c.created_at
     ORDER BY c.created_at DESC`,
    [teacherId]
  );

  return res.json({ data: result.rows });
}

// ── Estudiante: listar aulas a las que pertenece ──
async function listMyJoinedClassrooms(req, res) {
  const userId = req.user.id;

  const result = await query(
    `SELECT c.id, c.name AS classroom_name, c.description, c.code, c.created_at,
            u.name AS teacher_name
     FROM classroom_members cm
     JOIN classrooms c ON c.id = cm.classroom_id
     JOIN users u ON u.id = c.teacher_id
     WHERE cm.user_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );

  const rows = result.rows;

  // Contar miembros por aula (consulta individual para compatibilidad con pg-mem)
  for (const row of rows) {
    const counts = await query(
      'SELECT COUNT(*)::int AS member_count FROM classroom_members WHERE classroom_id = $1',
      [row.id]
    );
    row.member_count = counts.rows[0]?.member_count || 0;
  }

  return res.json({ data: rows });
}

// ── Profesor: crear aula ──
async function createClassroom(req, res) {
  const teacherId = req.user.id;
  const { name, description } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'El nombre del aula es requerido' });
  }

  // Generar código único
  let code = generateClassroomCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await query('SELECT id FROM classrooms WHERE code = $1', [code]);
    if (existing.rows.length === 0) break;
    code = generateClassroomCode();
    attempts++;
  }

  const result = await query(
    `INSERT INTO classrooms (name, description, teacher_id, code)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, code, created_at`,
    [String(name).trim(), String(description || '').trim(), teacherId, code]
  );

  return res.status(201).json({ data: result.rows[0] });
}

// ── Profesor: buscar estudiantes registrados ──
async function searchStudents(req, res) {
  const { q } = req.query;
  const term = String(q || '').trim();

  if (!term) {
    return res.json({ data: [] });
  }

  const result = await query(
    `SELECT id, name, username, role
     FROM users
     WHERE role = 'student'
       AND (LOWER(name) LIKE $1 OR LOWER(username) LIKE $1)
     ORDER BY name ASC
     LIMIT 20`,
    [`%${term.toLowerCase()}%`]
  );

  return res.json({ data: result.rows.map(publicUser) });
}

// ── Profesor: invitar a un estudiante a un aula ──
async function inviteStudent(req, res) {
  const teacherId = req.user.id;
  const classroomId = Number(req.params.id);
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'El estudiante es requerido' });
  }

  // Verificar que el aula pertenece al profesor
  const classroom = await query(
    'SELECT id, name FROM classrooms WHERE id = $1 AND teacher_id = $2',
    [classroomId, teacherId]
  );
  if (classroom.rows.length === 0) {
    return res.status(404).json({ message: 'Aula no encontrada' });
  }

  // Verificar que el usuario existe y es estudiante
  const student = await query(
    'SELECT id, name, username FROM users WHERE id = $1 AND role = $2',
    [userId, 'student']
  );
  if (student.rows.length === 0) {
    return res.status(404).json({ message: 'Estudiante no encontrado' });
  }

  // Verificar que no sea ya miembro
  const member = await query(
    'SELECT id FROM classroom_members WHERE classroom_id = $1 AND user_id = $2',
    [classroomId, userId]
  );
  if (member.rows.length > 0) {
    return res.status(409).json({ message: 'El estudiante ya es miembro del aula' });
  }

  // Crear o actualizar invitación (si ya existe pendiente, no duplicar)
  const existingInvite = await query(
    'SELECT id, status FROM classroom_invitations WHERE classroom_id = $1 AND user_id = $2',
    [classroomId, userId]
  );

  if (existingInvite.rows.length > 0) {
    if (existingInvite.rows[0].status === 'pending') {
      return res.status(409).json({ message: 'El estudiante ya tiene una invitación pendiente' });
    }
    // Si fue rechazada antes, reactivar como pendiente
    await query(
      'UPDATE classroom_invitations SET status = $1 WHERE id = $2',
      ['pending', existingInvite.rows[0].id]
    );
    return res.json({ data: { id: existingInvite.rows[0].id, status: 'pending' } });
  }

  const result = await query(
    `INSERT INTO classroom_invitations (classroom_id, user_id, status)
     VALUES ($1, $2, 'pending')
     RETURNING id, classroom_id, user_id, status, created_at`,
    [classroomId, userId]
  );

  return res.status(201).json({ data: result.rows[0] });
}

// ── Profesor: listar miembros de un aula ──
async function listMembers(req, res) {
  const teacherId = req.user.id;
  const classroomId = Number(req.params.id);

  const classroom = await query(
    'SELECT id FROM classrooms WHERE id = $1 AND teacher_id = $2',
    [classroomId, teacherId]
  );
  if (classroom.rows.length === 0) {
    return res.status(404).json({ message: 'Aula no encontrada' });
  }

  const result = await query(
    `SELECT u.id, u.name, u.username, cm.joined_at
     FROM classroom_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.classroom_id = $1
     ORDER BY u.name ASC`,
    [classroomId]
  );

  return res.json({ data: result.rows.map(publicUser) });
}

// ── Profesor: quitar miembro de un aula ──
async function removeMember(req, res) {
  const teacherId = req.user.id;
  const classroomId = Number(req.params.id);
  const userId = Number(req.params.userId);

  const classroom = await query(
    'SELECT id FROM classrooms WHERE id = $1 AND teacher_id = $2',
    [classroomId, teacherId]
  );
  if (classroom.rows.length === 0) {
    return res.status(404).json({ message: 'Aula no encontrada' });
  }

  await query(
    'DELETE FROM classroom_members WHERE classroom_id = $1 AND user_id = $2',
    [classroomId, userId]
  );

  return res.json({ message: 'Miembro eliminado' });
}

// ── Estudiante: listar invitaciones pendientes ──
async function listMyInvitations(req, res) {
  const userId = req.user.id;

  const result = await query(
    `SELECT ci.id, ci.status, ci.created_at,
            c.id AS classroom_id, c.name AS classroom_name, c.description,
            u.name AS teacher_name
     FROM classroom_invitations ci
     JOIN classrooms c ON c.id = ci.classroom_id
     JOIN users u ON u.id = c.teacher_id
     WHERE ci.user_id = $1 AND ci.status = 'pending'
     ORDER BY ci.created_at DESC`,
    [userId]
  );

  return res.json({ data: result.rows });
}

// ── Estudiante: aceptar invitación ──
async function acceptInvitation(req, res) {
  const userId = req.user.id;
  const invitationId = Number(req.params.id);

  const invitation = await query(
    'SELECT * FROM classroom_invitations WHERE id = $1 AND user_id = $2 AND status = $3',
    [invitationId, userId, 'pending']
  );
  if (invitation.rows.length === 0) {
    return res.status(404).json({ message: 'Invitación no encontrada' });
  }

  const inv = invitation.rows[0];

  // Añadir como miembro (evitar duplicado)
  await query(
    `INSERT INTO classroom_members (classroom_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (classroom_id, user_id) DO NOTHING`,
    [inv.classroom_id, userId]
  );

  // Marcar invitación como aceptada
  await query(
    'UPDATE classroom_invitations SET status = $1 WHERE id = $2',
    ['accepted', invitationId]
  );

  return res.json({ message: 'Invitación aceptada' });
}

// ── Estudiante: rechazar invitación ──
async function declineInvitation(req, res) {
  const userId = req.user.id;
  const invitationId = Number(req.params.id);

  const invitation = await query(
    'SELECT id FROM classroom_invitations WHERE id = $1 AND user_id = $2 AND status = $3',
    [invitationId, userId, 'pending']
  );
  if (invitation.rows.length === 0) {
    return res.status(404).json({ message: 'Invitación no encontrada' });
  }

  await query(
    'UPDATE classroom_invitations SET status = $1 WHERE id = $2',
    ['declined', invitationId]
  );

  return res.json({ message: 'Invitación rechazada' });
}

// ── Verificar acceso a un aula (profesor dueño o miembro) ──
async function getClassroomAccess(classroomId, userId) {
  const classroom = await query(
    'SELECT * FROM classrooms WHERE id = $1',
    [classroomId]
  );
  if (classroom.rows.length === 0) {
    return { error: 'Aula no encontrada', status: 404 };
  }

  const c = classroom.rows[0];
  if (c.teacher_id === userId) {
    return { classroom: c, isTeacher: true };
  }

  const member = await query(
    'SELECT id FROM classroom_members WHERE classroom_id = $1 AND user_id = $2',
    [classroomId, userId]
  );
  if (member.rows.length === 0) {
    return { error: 'No tienes acceso a este aula', status: 403 };
  }

  return { classroom: c, isTeacher: false };
}

// ── Ver detalle de un aula (profesor o miembro) ──
async function getClassroom(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  const c = access.classroom;
  const teacher = await query(
    'SELECT id, name, username FROM users WHERE id = $1',
    [c.teacher_id]
  );
  const memberCount = await query(
    'SELECT COUNT(*)::int AS count FROM classroom_members WHERE classroom_id = $1',
    [classroomId]
  );

  return res.json({
    data: {
      id: c.id,
      name: c.name,
      description: c.description,
      code: c.code,
      created_at: c.created_at,
      teacher: teacher.rows[0] ? publicUser(teacher.rows[0]) : null,
      member_count: memberCount.rows[0]?.count || 0,
      is_teacher: access.isTeacher,
    },
  });
}

// ── Publicar un anuncio en el muro (profesor o miembro) ──
async function createPost(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  const { content } = req.body;
  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El contenido de la publicación es requerido' });
  }

  const result = await query(
    `INSERT INTO classroom_posts (classroom_id, author_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, classroom_id, author_id, content, created_at`,
    [classroomId, req.user.id, String(content).trim()]
  );

  return res.status(201).json({ data: result.rows[0] });
}

// ── Listar publicaciones del muro ──
async function listPosts(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  const result = await query(
    `SELECT p.id, p.content, p.created_at,
            u.id AS author_id, u.name AS author_name, u.username AS author_username
     FROM classroom_posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.classroom_id = $1
     ORDER BY p.created_at DESC`,
    [classroomId]
  );

  return res.json({ data: result.rows });
}

// ── Crear tarea (profesor) ──
async function createAssignment(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }
  if (!access.isTeacher) {
    return res.status(403).json({ message: 'Solo el profesor puede crear tareas' });
  }

  const { title, description, dueDate } = req.body;
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'El título de la tarea es requerido' });
  }

  const due = dueDate ? new Date(dueDate) : null;
  if (due && Number.isNaN(due.getTime())) {
    return res.status(400).json({ message: 'Fecha de entrega inválida' });
  }

  const result = await query(
    `INSERT INTO classroom_assignments (classroom_id, teacher_id, title, description, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, classroom_id, teacher_id, title, description, due_date, created_at`,
    [classroomId, req.user.id, String(title).trim(), String(description || '').trim(), due]
  );

  return res.status(201).json({ data: result.rows[0] });
}

// ── Listar tareas del aula ──
async function listAssignments(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  const result = await query(
    `SELECT a.id, a.title, a.description, a.due_date, a.created_at,
            u.name AS teacher_name
     FROM classroom_assignments a
     JOIN users u ON u.id = a.teacher_id
     WHERE a.classroom_id = $1
     ORDER BY a.created_at DESC`,
    [classroomId]
  );

  const rows = result.rows;

  // Para estudiantes: indicar si ya entregó cada tarea
  if (!access.isTeacher) {
    for (const row of rows) {
      const sub = await query(
        'SELECT id, content, submitted_at FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
        [row.id, req.user.id]
      );
      row.submitted = sub.rows.length > 0;
      row.submission = sub.rows[0] || null;
    }
  }

  return res.json({ data: rows });
}

// ── Entregar tarea (estudiante) ──
async function submitAssignment(req, res) {
  const assignmentId = Number(req.params.id);
  const { content } = req.body;

  const assignment = await query(
    'SELECT * FROM classroom_assignments WHERE id = $1',
    [assignmentId]
  );
  if (assignment.rows.length === 0) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const a = assignment.rows[0];
  const access = await getClassroomAccess(a.classroom_id, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }
  if (access.isTeacher) {
    return res.status(403).json({ message: 'El profesor no puede entregar tareas' });
  }

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El contenido de la entrega es requerido' });
  }

  const result = await query(
    `INSERT INTO assignment_submissions (assignment_id, student_id, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET content = $3, submitted_at = NOW()
     RETURNING id, assignment_id, student_id, content, submitted_at`,
    [assignmentId, req.user.id, String(content).trim()]
  );

  return res.status(201).json({ data: result.rows[0] });
}

// ── Ver entregas de una tarea (profesor) ──
async function listSubmissions(req, res) {
  const assignmentId = Number(req.params.id);

  const assignment = await query(
    'SELECT * FROM classroom_assignments WHERE id = $1',
    [assignmentId]
  );
  if (assignment.rows.length === 0) {
    return res.status(404).json({ message: 'Tarea no encontrada' });
  }

  const a = assignment.rows[0];
  const access = await getClassroomAccess(a.classroom_id, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }
  if (!access.isTeacher) {
    return res.status(403).json({ message: 'Solo el profesor puede ver las entregas' });
  }

  const result = await query(
    `SELECT s.id, s.content, s.submitted_at,
            u.id AS student_id, u.name AS student_name, u.username AS student_username
     FROM assignment_submissions s
     JOIN users u ON u.id = s.student_id
     WHERE s.assignment_id = $1
     ORDER BY s.submitted_at DESC`,
    [assignmentId]
  );

  return res.json({ data: result.rows });
}

module.exports = {
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
};
