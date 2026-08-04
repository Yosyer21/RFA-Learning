// ═══════════════════════════════════════════════════════════
// RFA.Learning — Classroom detail
// Vista detallada de un aula: muro de publicaciones y tareas
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  let currentUser = null;
  let isTeacher = false;
  let classroomId = null;

  const classroomTitle = document.getElementById('classroom-title');
  const classroomDescription = document.getElementById('classroom-description');
  const classroomMeta = document.getElementById('classroom-meta');
  const postFormSection = document.getElementById('post-form-section');
  const assignmentFormSection = document.getElementById('assignment-form-section');
  const createPostForm = document.getElementById('create-post-form');
  const createAssignmentForm = document.getElementById('create-assignment-form');
  const postsList = document.getElementById('posts-list');
  const assignmentsList = document.getElementById('assignments-list');
  const membersSection = document.getElementById('members-section');
  const membersList = document.getElementById('members-list');
  const meetingsList = document.getElementById('meetings-list');
  const calendarList = document.getElementById('calendar-list');
  const postAttachmentInput = document.getElementById('post-attachment');
  const postAttachmentName = document.getElementById('post-attachment-name');
  const assignmentAttachmentInput = document.getElementById('assignment-attachment');
  const assignmentAttachmentName = document.getElementById('assignment-attachment-name');

  // Estado de adjuntos pendientes de subir
  let pendingPostAttachment = null;
  let pendingAssignmentAttachment = null;


  // Obtener el id del aula desde la URL (/classroom/:id)
  function getClassroomIdFromUrl() {
    const match = window.location.pathname.match(/^\/classroom\/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  function formatDate(value) {
    if (!value) return '';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString();
  }

  function formatDateTime(value) {
    if (!value) return '';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString();
  }

  function getInitial(name) {
    const clean = String(name || 'A').trim();
    return clean.charAt(0).toUpperCase() || 'A';
  }

  // ── Render cabecera del aula ──
  function renderClassroomHeader(c) {
    if (classroomTitle) classroomTitle.textContent = c.name;
    if (classroomDescription) classroomDescription.textContent = c.description || '';
    if (classroomMeta) {
      classroomMeta.innerHTML = `
        <span class="classroom-code">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          ${escapeHtml(c.code)}
        </span>
        <span class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${c.member_count || 0} ${t('classrooms.members')}
        </span>
        ${c.teacher ? `<span class="badge">${t('classrooms.teacher')}: ${escapeHtml(c.teacher.name)}</span>` : ''}
      `;
    }
  }

  // ── Subir un archivo adjunto ──
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const result = await apiJson('/api/classrooms/upload', {
      method: 'POST',
      body: formData,
    });
    return result;
  }

  // ── Render adjunto ──
  function renderAttachment(attachmentUrl, attachmentName) {
    if (!attachmentUrl) return '';
    const name = attachmentName || attachmentUrl.split('/').pop();
    return `
      <a class="attachment-link" href="${escapeHtml(attachmentUrl)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        ${escapeHtml(name)}
      </a>
    `;
  }

  // ── Render publicaciones ──
  function renderPosts(posts) {
    if (!postsList) return;

    if (!posts || posts.length === 0) {
      postsList.innerHTML = `<div class="empty-state">${t('classroom.noPosts')}</div>`;
      return;
    }

    postsList.innerHTML = posts.map((p) => `
      <article class="post-card">
        <div class="post-head">
          <span class="post-avatar">${escapeHtml(getInitial(p.author_name))}</span>
          <div class="post-author">
            <strong>${escapeHtml(p.author_name)}</strong>
            <small>${formatDateTime(p.created_at)}</small>
          </div>
        </div>
        <p class="post-content">${escapeHtml(p.content)}</p>
        ${renderAttachment(p.attachment_url, p.attachment_name)}
        <div class="post-comments">
          <button class="comments-toggle-btn" type="button" data-id="${p.id}">
            ${t('classroom.comments')} (${p.comment_count || 0})
          </button>
          <div class="comments-container" id="comments-${p.id}" hidden></div>
        </div>
      </article>
    `).join('');

    // Bind toggle de comentarios
    postsList.querySelectorAll('.comments-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => toggleComments(btn.dataset.id, btn));
    });
  }

  // ── Mostrar/ocultar comentarios de una publicación ──
  async function toggleComments(postId, btn) {
    const container = document.getElementById(`comments-${postId}`);
    if (!container) return;

    if (!container.hidden) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    container.innerHTML = `<div class="empty-state">${t('classroom.loading')}</div>`;

    const result = await apiJson(`/api/classrooms/posts/${postId}/comments`);
    if (!result) return;

    const comments = result.data?.data || [];
    container.innerHTML = `
      ${comments.length === 0
        ? `<div class="empty-state">${t('classroom.noComments')}</div>`
        : comments.map((c) => `
            <div class="comment-row">
              <span class="comment-avatar">${escapeHtml(getInitial(c.author_name))}</span>
              <div class="comment-body">
                <div class="comment-head">
                  <strong>${escapeHtml(c.author_name)}</strong>
                  <small>${formatDateTime(c.created_at)}</small>
                </div>
                <p>${escapeHtml(c.content)}</p>
              </div>
            </div>
          `).join('')}
      <form class="comment-form" data-post="${postId}">
        <input class="form-input" name="content" placeholder="${t('classroom.commentPlaceholder')}" required>
        <button class="btn btn-modern btn-modern-primary btn-sm" type="submit">${t('classroom.comment')}</button>
      </form>
    `;

    container.querySelector('.comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = e.currentTarget.querySelector('input[name="content"]');
      const content = input.value.trim();
      if (!content) return;
      const res = await apiJson(`/api/classrooms/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res && res.ok) {
        input.value = '';
        await toggleComments(postId, btn);
        await loadPosts();
      }
    });
  }


  // ── Render tareas ──
  function renderAssignments(assignments) {
    if (!assignmentsList) return;

    if (!assignments || assignments.length === 0) {
      assignmentsList.innerHTML = `<div class="empty-state">${t('classroom.noAssignments')}</div>`;
      return;
    }

    assignmentsList.innerHTML = assignments.map((a) => {
      const due = a.due_date ? `<span class="assignment-due-badge">${t('classroom.dueDate')}: ${formatDateTime(a.due_date)}</span>` : '';
      const status = a.submitted
        ? `<span class="assignment-status status-submitted">${t('classroom.submitted')}</span>`
        : `<span class="assignment-status status-pending">${t('classroom.pending')}</span>`;

      // Calificación visible para el estudiante
      let gradeBadge = '';
      if (!isTeacher && a.submission && a.submission.grade !== null && a.submission.grade !== undefined) {
        gradeBadge = `<span class="assignment-grade-badge">${t('classroom.grade')}: ${escapeHtml(a.submission.grade)}</span>`;
      }

      let actions = '';
      if (isTeacher) {
        actions = `<button class="btn btn-modern btn-modern-ghost btn-sm view-submissions-btn" type="button" data-id="${a.id}">${t('classroom.viewSubmissions')}</button>`;
      } else {
        actions = a.submitted
          ? `<button class="btn btn-modern btn-modern-ghost btn-sm edit-submission-btn" type="button" data-id="${a.id}">${t('classroom.editSubmission')}</button>`
          : `<button class="btn btn-modern btn-modern-primary btn-sm submit-btn" type="button" data-id="${a.id}">${t('classroom.submit')}</button>`;
      }

      return `
        <article class="assignment-card">
          <div class="assignment-head">
            <div class="assignment-title">
              <strong>${escapeHtml(a.title)}</strong>
              <small>${t('classrooms.teacher')}: ${escapeHtml(a.teacher_name || '')}</small>
            </div>
            <div class="assignment-status-group">
              ${gradeBadge}
              ${status}
            </div>
          </div>
          ${a.description ? `<p class="assignment-desc">${escapeHtml(a.description)}</p>` : ''}
          ${renderAttachment(a.attachment_url, a.attachment_name)}
          <div class="assignment-meta">
            ${due}
            <span class="assignment-created">${t('classroom.created')}: ${formatDate(a.created_at)}</span>
          </div>
          <div class="assignment-actions">
            ${actions}
          </div>
        </article>
      `;
    }).join('');


    // Bind events
    assignmentsList.querySelectorAll('.submit-btn').forEach((btn) => {
      btn.addEventListener('click', () => openSubmitModal(btn.dataset.id, null));
    });
    assignmentsList.querySelectorAll('.edit-submission-btn').forEach((btn) => {
      const assignment = assignments.find((a) => String(a.id) === btn.dataset.id);
      btn.addEventListener('click', () => openSubmitModal(btn.dataset.id, assignment?.submission || null));
    });
    assignmentsList.querySelectorAll('.view-submissions-btn').forEach((btn) => {
      btn.addEventListener('click', () => openSubmissionsModal(btn.dataset.id));
    });
  }

  // ── Modal de entrega (estudiante) ──
  function openSubmitModal(assignmentId, existingSubmission) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <h3>${existingSubmission ? t('classroom.editSubmission') : t('classroom.submit')}</h3>
          <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          <textarea id="submission-content" class="form-input" rows="5" placeholder="${t('classroom.submissionPlaceholder')}">${existingSubmission ? escapeHtml(existingSubmission.content) : ''}</textarea>
          <button id="submit-assignment-btn" class="btn btn-modern btn-modern-primary" type="button">${t('classroom.submit')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    const submitBtn = overlay.querySelector('#submit-assignment-btn');
    submitBtn.addEventListener('click', async () => {
      const content = overlay.querySelector('#submission-content').value.trim();
      if (!content) {
        showToast(t('classroom.submissionRequired'), 'error');
        return;
      }
      setButtonLoading(submitBtn, true);
      const result = await apiJson(`/api/classrooms/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setButtonLoading(submitBtn, false);
      if (!result) return;
      showToast(result.ok ? t('classroom.submitted') : (result.data.message || 'Error'), result.ok ? 'success' : 'error');
      if (result.ok) {
        closeModal();
        await loadAssignments();
      }
    });
  }

  // ── Videollamada (Jitsi Meet) ──
  // El botón "Unirse a reunión" navega a la página dedicada /meeting/:id
  function goToMeeting() {
    if (!classroomId) return;
    window.location.href = `/meeting/${classroomId}`;
  }

  // ── Modal de entregas (profesor) ──
  async function openSubmissionsModal(assignmentId) {
    const result = await apiJson(`/api/classrooms/assignments/${assignmentId}/submissions`);
    if (!result) return;

    const submissions = result.data?.data || [];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <h3>${t('classroom.viewSubmissions')}</h3>
          <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          ${submissions.length === 0
            ? `<div class="empty-state">${t('classroom.noSubmissions')}</div>`
            : submissions.map((s) => `
                <div class="submission-row">
                  <div class="submission-head">
                    <strong>${escapeHtml(s.student_name)}</strong>
                    <small>${formatDateTime(s.submitted_at)}</small>
                  </div>
                  <p class="submission-content">${escapeHtml(s.content)}</p>
                  <div class="submission-grade">
                    <input class="form-input grade-input" type="number" min="0" max="100" placeholder="${t('classroom.gradePlaceholder')}" value="${s.grade !== null && s.grade !== undefined ? escapeHtml(s.grade) : ''}" data-id="${s.id}">
                    <input class="form-input feedback-input" type="text" placeholder="${t('classroom.feedbackPlaceholder')}" value="${s.feedback ? escapeHtml(s.feedback) : ''}" data-id="${s.id}">
                    <button class="btn btn-modern btn-modern-primary btn-sm grade-btn" type="button" data-id="${s.id}">${t('classroom.saveGrade')}</button>
                  </div>
                </div>
              `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Bind calificación
    overlay.querySelectorAll('.grade-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const grade = overlay.querySelector(`.grade-input[data-id="${id}"]`).value;
        const feedback = overlay.querySelector(`.feedback-input[data-id="${id}"]`).value;
        setButtonLoading(btn, true);
        const res = await apiJson(`/api/classrooms/submissions/${id}/grade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade: grade === '' ? null : Number(grade), feedback }),
        });
        setButtonLoading(btn, false);
        if (!res) return;
        showToast(res.ok ? t('classroom.gradeSaved') : (res.data.message || 'Error'), res.ok ? 'success' : 'error');
      });
    });
  }

  // ── Render miembros y presencia (profesor) ──
  async function loadMembers() {
    if (!membersSection || !membersList) return;
    const result = await apiJson(`/api/classrooms/${classroomId}/members`);
    if (!result) return;

    const members = result.data?.data || [];
    membersSection.style.display = '';
    if (members.length === 0) {
      membersList.innerHTML = `<div class="empty-state">${t('classroom.noMembers')}</div>`;
      return;
    }

    membersList.innerHTML = members.map((m) => `
      <div class="member-row">
        <span class="member-avatar">${escapeHtml(getInitial(m.name))}</span>
        <div class="member-info">
          <strong>${escapeHtml(m.name)}</strong>
          <small>${escapeHtml(m.username)}</small>
        </div>
        <span class="presence-dot ${m.online ? 'online' : 'offline'}" title="${m.online ? t('classroom.online') : t('classroom.offline')}"></span>
      </div>
    `).join('');
  }

  // ── Render historial de reuniones ──
  async function loadMeetings() {
    if (!meetingsList) return;
    const result = await apiJson(`/api/classrooms/${classroomId}/meetings`);
    if (!result) return;

    const meetings = result.data?.data || [];
    if (meetings.length === 0) {
      meetingsList.innerHTML = `<div class="empty-state">${t('classroom.noMeetings')}</div>`;
      return;
    }

    meetingsList.innerHTML = meetings.map((m) => `
      <div class="meeting-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        <div class="meeting-info">
          <strong>${escapeHtml(m.started_by_name)}</strong>
          <small>${formatDateTime(m.started_at)}</small>
        </div>
      </div>
    `).join('');
  }

  // ── Render calendario de tareas ──
  async function loadCalendar() {
    if (!calendarList) return;
    const result = await apiJson('/api/classrooms/calendar');
    if (!result) return;

    const items = result.data?.data || [];
    if (items.length === 0) {
      calendarList.innerHTML = `<div class="empty-state">${t('classroom.noCalendar')}</div>`;
      return;
    }

    calendarList.innerHTML = items.map((item) => `
      <a class="calendar-row" href="/classroom/${item.classroom_id}">
        <div class="calendar-date">
          <strong>${formatDate(item.due_date)}</strong>
        </div>
        <div class="calendar-info">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.classroom_name)}</small>
        </div>
      </a>
    `).join('');
  }

  // ── Compartir enlace de reunión ──
  async function shareMeetingLink() {
    if (!classroomId) return;
    const result = await apiJson(`/api/classrooms/${classroomId}/meeting`);
    if (!result || !result.ok) return;

    const data = result.data?.data;
    if (!data) return;

    const link = `${window.location.origin}/meeting/${classroomId}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast(t('classroom.linkCopied'), 'success');
    } catch (err) {
      showToast(link, 'info');
    }
  }

  // ── Heartbeat de presencia ──
  function startPresenceHeartbeat() {
    if (!classroomId) return;
    const send = () => {
      apiJson(`/api/classrooms/${classroomId}/presence`, { method: 'POST' });
    };
    send();
    setInterval(send, 60000); // cada minuto
  }


  // ── Cargar detalle del aula ──
  async function loadClassroom() {
    const result = await apiJson(`/api/classrooms/${classroomId}`);
    if (!result) return;
    if (!result.ok) {
      showToast(result.data.message || 'Error', 'error');
      window.location.href = '/classrooms';
      return;
    }
    const c = result.data.data;
    renderClassroomHeader(c);
    isTeacher = c.is_teacher;

    // Mostrar formularios según rol
    if (postFormSection) postFormSection.style.display = '';
    if (assignmentFormSection) assignmentFormSection.style.display = isTeacher ? '' : 'none';
  }

  // ── Cargar publicaciones ──
  async function loadPosts() {
    const result = await apiJson(`/api/classrooms/${classroomId}/posts`);
    if (!result) return;
    renderPosts(result.data?.data || []);
  }

  // ── Cargar tareas ──
  async function loadAssignments() {
    const result = await apiJson(`/api/classrooms/${classroomId}/assignments`);
    if (!result) return;
    renderAssignments(result.data?.data || []);
  }

  // ── Selección de adjunto en publicación ──
  postAttachmentInput?.addEventListener('change', () => {
    const file = postAttachmentInput.files[0];
    if (file) {
      pendingPostAttachment = file;
      if (postAttachmentName) postAttachmentName.textContent = file.name;
    }
  });

  // ── Selección de adjunto en tarea ──
  assignmentAttachmentInput?.addEventListener('change', () => {
    const file = assignmentAttachmentInput.files[0];
    if (file) {
      pendingAssignmentAttachment = file;
      if (assignmentAttachmentName) assignmentAttachmentName.textContent = file.name;
    }
  });

  // ── Crear publicación ──
  createPostForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(createPostForm);
    const body = Object.fromEntries(formData.entries());

    const submitBtn = createPostForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    // Subir adjunto si existe
    if (pendingPostAttachment) {
      const up = await uploadFile(pendingPostAttachment);
      if (up && up.ok) {
        body.attachment_url = up.data.data.url;
        body.attachment_name = up.data.data.name;
      }
    }

    const result = await apiJson(`/api/classrooms/${classroomId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setButtonLoading(submitBtn, false);

    if (!result) return;
    showToast(result.ok ? t('classroom.published') : (result.data.message || 'Error'), result.ok ? 'success' : 'error');

    if (result.ok) {
      createPostForm.reset();
      pendingPostAttachment = null;
      if (postAttachmentName) postAttachmentName.textContent = '';
      await loadPosts();
    }
  });

  // ── Crear tarea ──
  createAssignmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(createAssignmentForm);
    const body = Object.fromEntries(formData.entries());

    const submitBtn = createAssignmentForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    // Subir adjunto si existe
    if (pendingAssignmentAttachment) {
      const up = await uploadFile(pendingAssignmentAttachment);
      if (up && up.ok) {
        body.attachment_url = up.data.data.url;
        body.attachment_name = up.data.data.name;
      }
    }

    const result = await apiJson(`/api/classrooms/${classroomId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setButtonLoading(submitBtn, false);

    if (!result) return;
    showToast(result.ok ? t('classroom.assignmentCreated') : (result.data.message || 'Error'), result.ok ? 'success' : 'error');

    if (result.ok) {
      createAssignmentForm.reset();
      pendingAssignmentAttachment = null;
      if (assignmentAttachmentName) assignmentAttachmentName.textContent = '';
      await loadAssignments();
    }
  });


  // ── Init ──
  async function init() {
    classroomId = getClassroomIdFromUrl();
    if (!classroomId) {
      window.location.href = '/classrooms';
      return;
    }

    const meResult = await apiJson('/api/auth/me');
    if (!meResult) return;

    currentUser = meResult.data.user;

    if (currentUser.preferredTheme && typeof window.applyThemeFromServer === 'function') {
      window.applyThemeFromServer(currentUser.preferredTheme);
    }

    await loadClassroom();

    // Cargar secciones según rol
    const loads = [loadPosts(), loadAssignments(), loadMeetings(), loadCalendar()];
    if (isTeacher) loads.push(loadMembers());
    await Promise.all(loads);

    // Heartbeat de presencia
    startPresenceHeartbeat();
  }

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });

  document.getElementById('meeting-btn')?.addEventListener('click', () => {
    goToMeeting();
  });

  document.getElementById('share-meeting-btn')?.addEventListener('click', () => {
    shareMeetingLink();
  });

  window.addEventListener('languagechange', () => {
    loadPosts();
    loadAssignments();
    loadMeetings();
    loadCalendar();
    if (isTeacher) loadMembers();
  });

  init();
})();


