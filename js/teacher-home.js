// ═══════════════════════════════════════════════════════════
// RFA.Learning — Teacher Home
// Home personalizado del profesor: estadísticas, accesos y aulas
// ═══════════════════════════════════════════════════════════

const classroomsList = document.getElementById('classrooms-list');
const createClassroomForm = document.getElementById('create-classroom-form');
const toggleClassroomFormBtn = document.getElementById('toggle-classroom-form');
const toggleClassroomFormBtn2 = document.getElementById('toggle-classroom-form-2');
const cancelClassroomFormBtn = document.getElementById('cancel-classroom-form');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t('home.greetMorning');
  if (h < 19) return t('home.greetAfternoon');
  return t('home.greetEvening');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString();
}

function toggleCreateForm() {
  createClassroomForm.classList.toggle('hidden');
  if (!createClassroomForm.classList.contains('hidden')) {
    createClassroomForm.querySelector('input[name="name"]')?.focus();
  }
}

function renderClassrooms(classrooms) {
  if (!classroomsList) return;

  if (!classrooms || classrooms.length === 0) {
    classroomsList.innerHTML = `<div class="empty-state">${t('teacher.classroomsEmpty')}</div>`;
    return;
  }

  classroomsList.innerHTML = classrooms.map((c) => `
    <article class="classroom-card">
      <div class="classroom-card-head">
        <span class="classroom-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
        </span>
        <div class="classroom-card-body">
          <strong>${escapeHtml(c.name)}</strong>
          ${c.description ? `<p>${escapeHtml(c.description)}</p>` : ''}
        </div>
      </div>
      <div class="classroom-card-meta">
        <span class="badge badge-active">${t('teacher.code')}: ${escapeHtml(c.code)}</span>
        <span class="badge">${c.member_count || 0} ${t('teacher.members')}</span>
        ${c.created_at ? `<span class="badge">${formatDate(c.created_at)}</span>` : ''}
      </div>
    </article>
  `).join('');

}

function renderStats(classrooms, totalClasses) {
  const totalMembers = (classrooms || []).reduce((sum, c) => sum + (c.member_count || 0), 0);
  const elClassrooms = document.getElementById('stat-classrooms');
  const elMembers = document.getElementById('stat-members');
  const elClasses = document.getElementById('stat-classes');

  if (elClassrooms) elClassrooms.textContent = classrooms ? classrooms.length : 0;
  if (elMembers) elMembers.textContent = totalMembers;
  if (elClasses) elClasses.textContent = totalClasses || 0;

  renderClassroomProgress(classrooms || [], totalMembers);
}

function renderClassroomProgress(classrooms, totalMembers) {
  const count = classrooms.length;
  const fill = document.getElementById('xp-bar-fill');
  const progressText = document.getElementById('xp-progress-text');
  const classesText = document.getElementById('xp-classes-text');
  const nextLabel = document.getElementById('xp-next-label');

  if (fill) fill.style.width = count > 0 ? '100%' : '0%';
  if (progressText) progressText.textContent = count > 0 ? '100%' : '0%';
  if (classesText) classesText.textContent = `${count} ${t('teacher.progressClasses')}`;
  if (nextLabel) {
    nextLabel.textContent = count > 0
      ? `${totalMembers} ${t('teacher.progressMembers')}`
      : t('teacher.progressNext');
  }
}


async function loadClassrooms() {
  const result = await apiJson('/api/classrooms');
  if (!result) return;
  const classrooms = result.data?.data || [];
  renderClassrooms(classrooms);

  // Cargar total de clases disponibles para la estadística
  const classesResult = await apiJson('/api/classes');
  const totalClasses = classesResult?.data?.length || classesResult?.data?.data?.length || 0;
  renderStats(classrooms, totalClasses);
}

// ── Toggle create form (desde hero y accesos rápidos) ──
toggleClassroomFormBtn?.addEventListener('click', toggleCreateForm);
toggleClassroomFormBtn2?.addEventListener('click', toggleCreateForm);

cancelClassroomFormBtn?.addEventListener('click', () => {
  createClassroomForm.classList.add('hidden');
  createClassroomForm.reset();
});

// ── Create classroom ──
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
  showToast(result.ok ? t('teacher.classroomCreated') : (result.data.message || 'Error'), result.ok ? 'success' : 'error');

  if (result.ok) {
    createClassroomForm.reset();
    createClassroomForm.classList.add('hidden');
    await loadClassrooms();
  }
});

// ── Init ──
async function init() {
  const meResult = await apiJson('/api/auth/me');
  if (!meResult) return;

  const user = meResult.data.user;
  document.getElementById('welcome').textContent = `${getGreeting()}, ${user.name}`;

  const elProfile = document.getElementById('stat-profile');
  if (elProfile) elProfile.textContent = user.name ? user.name.split(' ')[0].charAt(0).toUpperCase() : '--';

  if (user.preferredTheme && typeof window.applyThemeFromServer === 'function') {
    window.applyThemeFromServer(user.preferredTheme);
  }

  await loadClassrooms();
}

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

window.addEventListener('languagechange', () => {
  loadClassrooms();
});

init();
