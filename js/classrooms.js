// ═══════════════════════════════════════════════════════════
// RFA.Learning — Classrooms
// Página de aulas: profesores crean e invitan, estudiantes aceptan
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  let currentUser = null;
  let isTeacher = false;

  const classroomsList = document.getElementById('classrooms-list');
  const createClassroomForm = document.getElementById('create-classroom-form');
  const teacherCreateSection = document.getElementById('teacher-create-section');
  const studentInvitationsSection = document.getElementById('student-invitations-section');
  const invitationsList = document.getElementById('invitations-list');
  const listTitle = document.getElementById('list-title');

  function formatDate(value) {
    if (!value) return '';
    const parsed = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString();
  }

  // Obtiene la inicial del nombre para el avatar
  function getInitial(name) {
    const clean = String(name || 'A').trim();
    return clean.charAt(0).toUpperCase() || 'A';
  }

  // ── Render aulas (profesor) ──
  function renderTeacherClassrooms(classrooms) {
    if (!classroomsList) return;

    if (!classrooms || classrooms.length === 0) {
      classroomsList.innerHTML = `<div class="empty-state">${t('classrooms.empty')}</div>`;
      return;
    }

    classroomsList.innerHTML = classrooms.map((c) => `
      <article class="classroom-card" data-classroom-id="${c.id}">
        <div class="classroom-card-head">
          <span class="classroom-avatar">${escapeHtml(getInitial(c.name))}</span>
          <div class="classroom-card-body">
            <strong>${escapeHtml(c.name)}</strong>
            ${c.description ? `<p>${escapeHtml(c.description)}</p>` : ''}
          </div>
        </div>
        <div class="classroom-card-meta">
          <span class="classroom-code">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            ${escapeHtml(c.code)}
          </span>
          <span class="badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ${c.member_count || 0} ${t('classrooms.members')}
          </span>
          ${c.created_at ? `<span class="badge">${formatDate(c.created_at)}</span>` : ''}
        </div>
        <div class="classroom-card-actions">
          <button class="btn btn-modern btn-modern-primary btn-sm invite-btn" type="button" data-classroom-id="${c.id}" data-classroom-name="${escapeHtml(c.name)}">
            ${t('classrooms.inviteBtn')}
          </button>
        </div>
      </article>
    `).join('');

    classroomsList.querySelectorAll('.invite-btn').forEach((btn) => {
      btn.addEventListener('click', () => openInviteModal(btn.dataset.classroomId, btn.dataset.classroomName));
    });
  }

  // ── Render aulas (estudiante) ──
  function renderStudentClassrooms(classrooms) {
    if (!classroomsList) return;

    if (!classrooms || classrooms.length === 0) {
      classroomsList.innerHTML = `<div class="empty-state">${t('classrooms.emptyStudent')}</div>`;
      return;
    }

    classroomsList.innerHTML = classrooms.map((c) => `
      <article class="classroom-card" data-classroom-id="${c.id}">
        <div class="classroom-card-head">
          <span class="classroom-avatar">${escapeHtml(getInitial(c.classroom_name || c.name))}</span>
          <div class="classroom-card-body">
            <strong>${escapeHtml(c.classroom_name || c.name)}</strong>
            ${c.description ? `<p>${escapeHtml(c.description)}</p>` : ''}
            <span class="classroom-teacher">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              ${t('classrooms.teacher')}: ${escapeHtml(c.teacher_name || '')}
            </span>
          </div>
        </div>
        <div class="classroom-card-meta">
          <span class="badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ${c.member_count || 0} ${t('classrooms.members')}
          </span>
          ${c.created_at ? `<span class="badge">${formatDate(c.created_at)}</span>` : ''}
        </div>
      </article>
    `).join('');
  }

  // ── Render invitaciones (estudiante) ──
  function renderInvitations(invitations) {
    if (!invitationsList) return;

    if (!invitations || invitations.length === 0) {
      invitationsList.innerHTML = `<div class="empty-state">${t('classrooms.noInvitations')}</div>`;
      return;
    }

    invitationsList.innerHTML = invitations.map((inv) => `
      <article class="classroom-card invitation-card" data-invitation-id="${inv.id}">
        <div class="classroom-card-head">
          <span class="classroom-avatar">${escapeHtml(getInitial(inv.classroom_name))}</span>
          <div class="classroom-card-body">
            <strong>${escapeHtml(inv.classroom_name)}</strong>
            ${inv.description ? `<p>${escapeHtml(inv.description)}</p>` : ''}
            <span class="classroom-teacher">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              ${t('classrooms.teacher')}: ${escapeHtml(inv.teacher_name || '')}
            </span>
          </div>
        </div>
        <div class="invitation-actions">
          <button class="btn btn-modern btn-modern-primary btn-sm accept-btn" type="button" data-id="${inv.id}">${t('classrooms.accept')}</button>
          <button class="btn btn-modern btn-modern-ghost btn-sm decline-btn" type="button" data-id="${inv.id}">${t('classrooms.decline')}</button>
        </div>
      </article>
    `).join('');

    invitationsList.querySelectorAll('.accept-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleInvitation(btn.dataset.id, 'accept'));
    });
    invitationsList.querySelectorAll('.decline-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleInvitation(btn.dataset.id, 'decline'));
    });
  }

  // ── Aceptar / rechazar invitación ──
  async function handleInvitation(id, action) {
    const result = await apiJson(`/api/classrooms/invitations/${id}/${action}`, { method: 'POST' });
    if (!result) return;
    showToast(
      result.ok
        ? (action === 'accept' ? t('classrooms.accepted') : t('classrooms.declined'))
        : (result.data.message || 'Error'),
      result.ok ? 'success' : 'error'
    );
    if (result.ok) {
      await loadStudentData();
    }
  }

  // ── Modal de invitación (profesor) ──
  function openInviteModal(classroomId, classroomName) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <h3>${t('classrooms.inviteTitle')}: ${escapeHtml(classroomName)}</h3>
          <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          <input id="student-search-input" class="form-input" type="text" placeholder="${t('classrooms.searchPlaceholder')}" autocomplete="off">
          <div id="student-search-results" class="student-search-results"></div>
          <div id="invite-members-list" class="invite-members-list"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    const searchInput = overlay.querySelector('#student-search-input');
    const resultsEl = overlay.querySelector('#student-search-results');
    const membersEl = overlay.querySelector('#invite-members-list');

    let searchTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => searchStudents(searchInput.value, resultsEl, classroomId), 250);
    });

    loadMembers(classroomId, membersEl);
  }

  async function searchStudents(query, resultsEl, classroomId) {
    const term = String(query || '').trim();
    if (!term) {
      resultsEl.innerHTML = '';
      return;
    }

    const result = await apiJson(`/api/classrooms/search-students?q=${encodeURIComponent(term)}`);
    if (!result) return;

    const students = result.data?.data || [];
    if (students.length === 0) {
      resultsEl.innerHTML = `<div class="empty-state">${t('classrooms.noStudents')}</div>`;
      return;
    }

    resultsEl.innerHTML = students.map((s) => `
      <div class="student-result">
        <div class="student-result-info">
          <strong>${escapeHtml(s.name)}</strong>
          <small>${escapeHtml(s.username)}</small>
        </div>
        <button class="btn btn-modern btn-modern-primary btn-sm" type="button" data-user-id="${s.id}">${t('classrooms.inviteBtn')}</button>
      </div>
    `).join('');

    resultsEl.querySelectorAll('button[data-user-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const res = await apiJson(`/api/classrooms/${classroomId}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Number(btn.dataset.userId) }),
        });
        if (!res) return;
        showToast(res.ok ? t('classrooms.invited') : (res.data.message || 'Error'), res.ok ? 'success' : 'error');
        if (res.ok) {
          btn.disabled = true;
          btn.textContent = t('classrooms.invited');
        }
      });
    });
  }

  async function loadMembers(classroomId, membersEl) {
    const result = await apiJson(`/api/classrooms/${classroomId}/members`);
    if (!result) return;

    const members = result.data?.data || [];
    if (members.length === 0) {
      membersEl.innerHTML = `<div class="empty-state">${t('classrooms.noMembers')}</div>`;
      return;
    }

    membersEl.innerHTML = `
      <h4 class="members-title">${t('classrooms.membersTitle')}</h4>
      ${members.map((m) => `
        <div class="member-row">
          <div class="member-info">
            <strong>${escapeHtml(m.name)}</strong>
            <small>${escapeHtml(m.username)}</small>
          </div>
          <button class="btn btn-modern btn-modern-danger btn-sm" type="button" data-user-id="${m.id}">${t('classrooms.remove')}</button>
        </div>
      `).join('')}
    `;

    membersEl.querySelectorAll('button[data-user-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const res = await apiJson(`/api/classrooms/${classroomId}/members/${btn.dataset.userId}`, { method: 'DELETE' });
        if (!res) return;
        showToast(res.ok ? t('classrooms.removed') : (res.data.message || 'Error'), res.ok ? 'success' : 'error');
        if (res.ok) {
          loadMembers(classroomId, membersEl);
        }
      });
    });
  }

  // ── Cargar datos del profesor ──
  async function loadTeacherData() {
    const result = await apiJson('/api/classrooms');
    if (!result) return;
    renderTeacherClassrooms(result.data?.data || []);
  }

  // ── Cargar datos del estudiante ──
  async function loadStudentData() {
    const [joinedResult, invitationsResult] = await Promise.all([
      apiJson('/api/classrooms/joined'),
      apiJson('/api/classrooms/invitations'),
    ]);

    if (joinedResult) renderStudentClassrooms(joinedResult.data?.data || []);
    if (invitationsResult) renderInvitations(invitationsResult.data?.data || []);
  }

  // ── Crear aula ──
  createClassroomForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(createClassroomForm);
    const body = Object.fromEntries(formData.entries());

    const submitBtn = createClassroomForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    const result = await apiJson('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setButtonLoading(submitBtn, false);

    if (!result) return;
    showToast(result.ok ? t('classrooms.created') : (result.data.message || 'Error'), result.ok ? 'success' : 'error');

    if (result.ok) {
      createClassroomForm.reset();
      await loadTeacherData();
    }
  });

  // ── Init ──
  async function init() {
    const meResult = await apiJson('/api/auth/me');
    if (!meResult) return;

    currentUser = meResult.data.user;
    isTeacher = currentUser.role === 'teacher';

    if (currentUser.preferredTheme && typeof window.applyThemeFromServer === 'function') {
      window.applyThemeFromServer(currentUser.preferredTheme);
    }

    if (isTeacher) {
      if (teacherCreateSection) teacherCreateSection.style.display = '';
      if (studentInvitationsSection) studentInvitationsSection.style.display = 'none';
      if (listTitle) listTitle.textContent = t('classrooms.listTitle');
      await loadTeacherData();
    } else {
      if (teacherCreateSection) teacherCreateSection.style.display = 'none';
      if (studentInvitationsSection) studentInvitationsSection.style.display = '';
      if (listTitle) listTitle.textContent = t('classrooms.listTitleStudent');
      await loadStudentData();
    }
  }

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });

  window.addEventListener('languagechange', () => {
    if (isTeacher) loadTeacherData();
    else loadStudentData();
  });

  // Navegar a la vista detallada al hacer clic en una tarjeta de aula
  classroomsList?.addEventListener('click', (e) => {
    const card = e.target.closest('.classroom-card');
    if (!card) return;
    // No navegar si se hizo clic en un botón de acción (invitar, aceptar, etc.)
    if (e.target.closest('button')) return;
    const id = card.dataset.classroomId;
    if (id) window.location.href = `/classroom/${id}`;
  });

  init();
})();
