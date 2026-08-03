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
      </article>
    `).join('');
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
            ${status}
          </div>
          ${a.description ? `<p class="assignment-desc">${escapeHtml(a.description)}</p>` : ''}
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

  // ── Crear publicación ──
  createPostForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(createPostForm);
    const body = Object.fromEntries(formData.entries());

    const submitBtn = createPostForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

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
    await Promise.all([loadPosts(), loadAssignments()]);
  }

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });

  window.addEventListener('languagechange', () => {
    loadPosts();
    loadAssignments();
  });

  init();
})();
