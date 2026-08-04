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

// Crea una notificación para un usuario
async function createNotification(userId, { type = 'info', title, body = '', link = '' }) {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, link]
    );
  } catch (err) {
    // No bloquear la operación principal si falla la notificación
    // eslint-disable-next-line no-console
    console.error('Error creating notification:', err.message);
  }
}

// Notifica a todos los miembros de un aula (excepto el autor)
async function notifyClassroomMembers(classroomId, exceptUserId, { type, title, body, link }) {
  const members = await query(
    'SELECT user_id FROM classroom_members WHERE classroom_id = $1 AND user_id <> $2',
    [classroomId, exceptUserId]
  );
  for (const m of members.rows) {
    await createNotification(m.user_id, { type, title, body, link });
  }
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
    `SELECT u.id, u.name, u.username, cm.joined_at, cm.last_seen_at
     FROM classroom_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.classroom_id = $1
     ORDER BY u.name ASC`,
    [classroomId]
  );

  const rows = result.rows.map(publicUser);
  // Indicador de presencia: online si estuvo activo en los últimos 5 minutos
  const now = Date.now();
  for (const row of rows) {
    if (row.last_seen_at) {
      const lastSeen = new Date(String(row.last_seen_at).replace(' ', 'T')).getTime();
      row.online = !Number.isNaN(lastSeen) && now - lastSeen < 5 * 60 * 1000;
    } else {
      row.online = false;
    }
  }

  return res.json({ data: rows });
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

// ── Obtener datos de la reunión (videollamada Jitsi) ──
// Solo miembros del aula pueden obtener la URL de la sala.
// La sala se basa en el código del aula para que todos se unan a la misma.
async function getMeeting(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  const c = access.classroom;

  // Nombre de sala determinista y seguro basado en el código del aula
  const roomName = 'rfa-classroom-' + String(c.code || classroomId).toLowerCase().replace(/[^a-z0-9-]/g, '');
  const displayName = req.user.name || req.user.username || 'Estudiante';

  return res.json({
    data: {
      roomName,
      displayName,
      isTeacher: access.isTeacher,
      // Dominio público de Jitsi Meet (sin servidor propio)
      domain: 'meet.jit.si',
    },
  });
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

  const { content, attachment_url, attachment_name } = req.body;
  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El contenido de la publicación es requerido' });
  }

  const result = await query(
    `INSERT INTO classroom_posts (classroom_id, author_id, content, attachment_url, attachment_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, classroom_id, author_id, content, attachment_url, attachment_name, created_at`,
    [classroomId, req.user.id, String(content).trim(), attachment_url || null, attachment_name || null]
  );


  // Notificar a los demás miembros del aula
  const c = access.classroom;
  await notifyClassroomMembers(classroomId, req.user.id, {
    type: 'post',
    title: `Nueva publicación en ${c.name}`,
    body: String(content).trim().slice(0, 120),
    link: `/classroom/${classroomId}`,
  });

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
    `SELECT p.id, p.content, p.attachment_url, p.attachment_name, p.created_at,
            u.id AS author_id, u.name AS author_name, u.username AS author_username
     FROM classroom_posts p
     JOIN users u ON u.id = p.author_id
     WHERE p.classroom_id = $1
     ORDER BY p.created_at DESC`,
    [classroomId]
  );

  const rows = result.rows;

  // Contar comentarios por publicación (consulta individual para pg-mem)
  for (const row of rows) {
    const cnt = await query(
      'SELECT COUNT(*)::int AS count FROM classroom_post_comments WHERE post_id = $1',
      [row.id]
    );
    row.comment_count = cnt.rows[0]?.count || 0;
  }

  return res.json({ data: rows });
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

  const { title, description, due_date, attachment_url, attachment_name } = req.body;
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'El título de la tarea es requerido' });
  }

  const due = due_date ? new Date(due_date) : null;
  if (due && Number.isNaN(due.getTime())) {
    return res.status(400).json({ message: 'Fecha de entrega inválida' });
  }

  const result = await query(
    `INSERT INTO classroom_assignments (classroom_id, teacher_id, title, description, due_date, attachment_url, attachment_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, classroom_id, teacher_id, title, description, due_date, attachment_url, attachment_name, created_at`,
    [classroomId, req.user.id, String(title).trim(), String(description || '').trim(), due, attachment_url || null, attachment_name || null]
  );


  // Notificar a los estudiantes del aula
  const c = access.classroom;
  await notifyClassroomMembers(classroomId, req.user.id, {
    type: 'assignment',
    title: `Nueva tarea en ${c.name}`,
    body: String(title).trim(),
    link: `/classroom/${classroomId}`,
  });

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
    `SELECT a.id, a.title, a.description, a.due_date, a.attachment_url, a.attachment_name, a.created_at,
            u.name AS teacher_name
     FROM classroom_assignments a
     JOIN users u ON u.id = a.teacher_id
     WHERE a.classroom_id = $1
     ORDER BY a.created_at DESC`,
    [classroomId]
  );

  const rows = result.rows;

  // Para estudiantes: indicar si ya entregó cada tarea y su calificación
  if (!access.isTeacher) {
    for (const row of rows) {
      const sub = await query(
        'SELECT id, content, submitted_at, grade, feedback, graded_at FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
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
     DO UPDATE SET content = $3, submitted_at = NOW(), grade = NULL, feedback = NULL, graded_at = NULL
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
    `SELECT s.id, s.content, s.submitted_at, s.grade, s.feedback, s.graded_at,
            u.id AS student_id, u.name AS student_name, u.username AS student_username
     FROM assignment_submissions s
     JOIN users u ON u.id = s.student_id
     WHERE s.assignment_id = $1
     ORDER BY s.submitted_at DESC`,
    [assignmentId]
  );

  return res.json({ data: result.rows });
}

// ── Calificar una entrega (profesor) ──
async function gradeSubmission(req, res) {
  const submissionId = Number(req.params.id);
  const { grade, feedback } = req.body;

  const submission = await query(
    'SELECT * FROM assignment_submissions WHERE id = $1',
    [submissionId]
  );
  if (submission.rows.length === 0) {
    return res.status(404).json({ message: 'Entrega no encontrada' });
  }

  const s = submission.rows[0];
  const assignment = await query(
    'SELECT * FROM classroom_assignments WHERE id = $1',
    [s.assignment_id]
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
    return res.status(403).json({ message: 'Solo el profesor puede calificar' });
  }

  const parsedGrade = grade === null || grade === undefined || grade === '' ? null : Number(grade);
  if (parsedGrade !== null && (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 100)) {
    return res.status(400).json({ message: 'La calificación debe estar entre 0 y 100' });
  }

  const result = await query(
    `UPDATE assignment_submissions
     SET grade = $1, feedback = $2, graded_at = NOW()
     WHERE id = $3
     RETURNING id, assignment_id, student_id, content, submitted_at, grade, feedback, graded_at`,
    [parsedGrade, String(feedback || '').trim(), submissionId]
  );

  // Notificar al estudiante
  await createNotification(s.student_id, {
    type: 'grade',
    title: `Tarea calificada: ${a.title}`,
    body: parsedGrade !== null ? `Calificación: ${parsedGrade}` : 'Tu tarea fue revisada',
    link: `/classroom/${a.classroom_id}`,
  });

  return res.json({ data: result.rows[0] });
}

// ── Comentar una publicación (miembro del aula) ──
async function createComment(req, res) {
  const postId = Number(req.params.postId);
  const { content } = req.body;

  const post = await query(
    'SELECT * FROM classroom_posts WHERE id = $1',
    [postId]
  );
  if (post.rows.length === 0) {
    return res.status(404).json({ message: 'Publicación no encontrada' });
  }

  const p = post.rows[0];
  const access = await getClassroomAccess(p.classroom_id, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: 'El comentario es requerido' });
  }

  const result = await query(
    `INSERT INTO classroom_post_comments (post_id, author_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, post_id, author_id, content, created_at`,
    [postId, req.user.id, String(content).trim()]
  );

  return res.status(201).json({ data: result.rows[0] });
}

// ── Listar comentarios de una publicación ──
async function listComments(req, res) {
  const postId = Number(req.params.postId);

  const post = await query(
    'SELECT * FROM classroom_posts WHERE id = $1',
    [postId]
  );
  if (post.rows.length === 0) {
    return res.status(404).json({ message: 'Publicación no encontrada' });
  }

  const p = post.rows[0];
  const access = await getClassroomAccess(p.classroom_id, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  const result = await query(
    `SELECT c.id, c.content, c.created_at,
            u.id AS author_id, u.name AS author_name, u.username AS author_username
     FROM classroom_post_comments c
     JOIN users u ON u.id = c.author_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    [postId]
  );

  return res.json({ data: result.rows });
}

// ── Registrar el inicio de una reunión (historial) ──
async function recordMeeting(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  const result = await query(
    `INSERT INTO classroom_meetings (classroom_id, started_by)
     VALUES ($1, $2)
     RETURNING id, classroom_id, started_by, started_at`,
    [classroomId, req.user.id]
  );

  return res.status(201).json({ data: result.rows[0] });
}

// ── Listar historial de reuniones del aula ──
async function listMeetings(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  const result = await query(
    `SELECT m.id, m.started_at,
            u.id AS started_by_id, u.name AS started_by_name
     FROM classroom_meetings m
     JOIN users u ON u.id = m.started_by
     WHERE m.classroom_id = $1
     ORDER BY m.started_at DESC
     LIMIT 50`,
    [classroomId]
  );

  return res.json({ data: result.rows });
}

// ── Actualizar presencia (heartbeat) ──
async function updatePresence(req, res) {
  const classroomId = Number(req.params.id);
  const access = await getClassroomAccess(classroomId, req.user.id);
  if (access.error) {
    return res.status(access.status).json({ message: access.error });
  }

  await query(
    `UPDATE classroom_members
     SET last_seen_at = NOW()
     WHERE classroom_id = $1 AND user_id = $2`,
    [classroomId, req.user.id]
  );

  return res.json({ message: 'ok' });
}

// ── Subir un archivo adjunto ──
async function uploadAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No se recibió ningún archivo' });
  }

  const url = `/uploads/${req.file.filename}`;
  return res.status(201).json({
    data: {
      url,
      name: req.file.originalname,
      size: req.file.size,
    },
  });
}

// ── Listar notificaciones del usuario ──
async function listNotifications(req, res) {
  const result = await query(
    `SELECT id, type, title, body, link, is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [req.user.id]
  );

  return res.json({ data: result.rows });
}

// ── Contar notificaciones no leídas ──
async function getUnreadCount(req, res) {
  const result = await query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [req.user.id]
  );

  return res.json({ data: { count: result.rows[0]?.count || 0 } });
}

// ── Marcar notificaciones como leídas ──
async function markNotificationsRead(req, res) {
  const { ids } = req.body;

  if (Array.isArray(ids) && ids.length > 0) {
    // Marcar solo las indicadas
    for (const id of ids) {
      await query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [Number(id), req.user.id]
      );
    }
  } else {
    // Marcar todas como leídas
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
  }

  return res.json({ message: 'Notificaciones marcadas como leídas' });
}

// ── Calendario de tareas (todas las aulas del usuario) ──
async function getCalendar(req, res) {
  const userId = req.user.id;

  // Aulas donde el usuario es profesor
  const teacherClassrooms = await query(
    'SELECT id FROM classrooms WHERE teacher_id = $1',
    [userId]
  );

  // Aulas donde el usuario es miembro
  const memberClassrooms = await query(
    'SELECT classroom_id AS id FROM classroom_members WHERE user_id = $1',
    [userId]
  );

  const ids = new Set([
    ...teacherClassrooms.rows.map((r) => r.id),
    ...memberClassrooms.rows.map((r) => r.id),
  ]);

  if (ids.size === 0) {
    return res.json({ data: [] });
  }

  const result = await query(
    `SELECT a.id, a.title, a.due_date, a.created_at,
            c.id AS classroom_id, c.name AS classroom_name
     FROM classroom_assignments a
     JOIN classrooms c ON c.id = a.classroom_id
     WHERE a.classroom_id = ANY($1::int[])
       AND a.due_date IS NOT NULL
     ORDER BY a.due_date ASC`,
    [Array.from(ids)]
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
};


