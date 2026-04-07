const statsData = document.getElementById('stats-data');
const statsCards = document.getElementById('stats-cards');
const usersList = document.getElementById('users-list');
const classesList = document.getElementById('classes-list');
const paidSummary = document.getElementById('paid-summary');
const paidAccountsList = document.getElementById('paid-accounts-list');
const paidSyncStatus = document.getElementById('paid-sync-status');
const createUserForm = document.getElementById('create-user-form');
const createClassForm = document.getElementById('create-class-form');
const csvImportForm = document.getElementById('csv-import-form');
let currentUsersPage = 1;
let currentClassesPage = 1;

function smoothSectionNav() {
  document.querySelectorAll('.dashboard-nav a').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

async function loadStats() {
  const result = await apiJson('/api/admin/stats');
  if (!result) return;

  const data = result.data;
  const items = [
    [t('dashboard.statUsers'), data.totalUsers ?? 0],
    [t('dashboard.statAdmins'), data.totalAdmins ?? 0],
    [t('dashboard.statStudents'), data.totalStudents ?? 0],
    [t('dashboard.statActive'), data.activeStudents ?? 0],
    [t('dashboard.statClasses'), data.totalClasses ?? 0],
    [t('dashboard.statProgress'), data.progressRecords ?? 0],
  ];

  statsCards.innerHTML = items
    .map(
      ([label, value]) => `
      <article class="stat-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `
    )
    .join('');

  statsData.textContent = JSON.stringify(data, null, 2);
}

function formatDashboardDate(value) {
  if (!value) return '';

  const parsed = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(currentLang === 'en' ? 'en-US' : 'es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function formatCurrency(value, currency) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  if (!currency) {
    return numericValue.toFixed(2);
  }

  try {
    return new Intl.NumberFormat(currentLang === 'en' ? 'en-US' : 'es-ES', {
      style: 'currency',
      currency,
    }).format(numericValue);
  } catch (_error) {
    return `${currency} ${numericValue.toFixed(2)}`;
  }
}

function renderPaidAccount(account) {
  const personName = account.customerName || account.billingName || account.email;
  const orderLabel = account.orderNumber ? `#${escapeHtml(account.orderNumber)}` : t('dashboard.paidOrderUnknown');
  const amountLabel = formatCurrency(account.total, account.currency);
  const paidLabel = account.paidAt || account.createdAt ? formatDashboardDate(account.paidAt || account.createdAt) : '';

  return `
    <article class="paid-account-card">
      <div class="paid-account-card__top">
        <div class="paid-account-card__name">
          <strong>${escapeHtml(personName)}</strong>
          <span>${escapeHtml(account.email)}</span>
        </div>
        <div class="paid-account-card__meta">
          <span>${escapeHtml(orderLabel)}</span>
        </div>
      </div>
      <div class="paid-account-card__chips">
        <span class="badge badge-active">${escapeHtml(t('dashboard.paidConfirmed'))}</span>
        ${account.product ? `<span class="badge badge-student">${escapeHtml(account.product)}</span>` : ''}
        ${account.fulfillmentStatus ? `<span class="badge">${escapeHtml(account.fulfillmentStatus)}</span>` : ''}
        ${amountLabel ? `<span class="badge">${escapeHtml(amountLabel)}</span>` : ''}
        ${paidLabel ? `<span class="badge">${escapeHtml(paidLabel)}</span>` : ''}
      </div>
    </article>
  `;
}

async function loadPaidAccounts() {
  const result = await apiJson('/api/admin/paid-accounts');
  if (!result) return;

  if (!result.ok) {
    const message = result.status === 503
      ? t('dashboard.paidAccountsUnavailable')
      : (result.data.message || t('dashboard.paidAccountsError'));

    if (paidSyncStatus) {
      paidSyncStatus.textContent = t('dashboard.syncError');
      paidSyncStatus.classList.add('badge-error');
    }

    paidSummary.innerHTML = `
      <article class="stat-card"><span>${escapeHtml(t('dashboard.paidPeople'))}</span><strong>0</strong></article>
      <article class="stat-card"><span>${escapeHtml(t('dashboard.paidOrders'))}</span><strong>0</strong></article>
      <article class="stat-card"><span>${escapeHtml(t('dashboard.lastPayment'))}</span><strong>—</strong></article>
    `;
    paidAccountsList.innerHTML = `<div class="paid-account-empty">${escapeHtml(message)}</div>`;
    return;
  }

  const data = result.data;
  const accounts = Array.isArray(data.accounts) ? data.accounts : [];

  if (paidSyncStatus) {
    paidSyncStatus.textContent = t('dashboard.synced');
    paidSyncStatus.classList.remove('badge-error');
  }

  paidSummary.innerHTML = [
    [t('dashboard.paidPeople'), data.totalPeople ?? accounts.length ?? 0],
    [t('dashboard.paidOrders'), data.totalOrders ?? accounts.length ?? 0],
    [t('dashboard.lastPayment'), formatDashboardDate(data.lastPaidAt) || '—'],
  ]
    .map(([label, value]) => `
      <article class="stat-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
      </article>
    `)
    .join('');

  if (accounts.length === 0) {
    paidAccountsList.innerHTML = `<div class="paid-account-empty">${escapeHtml(t('dashboard.paidAccountsEmpty'))}</div>`;
    return;
  }

  paidAccountsList.innerHTML = accounts.map(renderPaidAccount).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function userRow(user) {
  const roleBadge = user.role === 'admin' ? 'badge-admin' : 'badge-student';
  const stateBadge = user.active ? 'badge-active' : 'badge-inactive';
  const translatedRole = translateUserRole(user.role);
  const roleOptions = ['student', 'admin']
    .map((role) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${escapeHtml(translateUserRole(role))}</option>`)
    .join('');
  const activeOptions = [
    { value: 'true', label: t('dashboard.active'), selected: user.active },
    { value: 'false', label: t('dashboard.inactive'), selected: !user.active },
  ]
    .map((item) => `<option value="${item.value}" ${item.selected ? 'selected' : ''}>${escapeHtml(item.label)}</option>`)
    .join('');
  const passwordOptions = [
    { value: 'false', label: t('dashboard.normalPassword'), selected: !user.mustChangePassword },
    { value: 'true', label: t('dashboard.forcePassword'), selected: user.mustChangePassword },
  ]
    .map((item) => `<option value="${item.value}" ${item.selected ? 'selected' : ''}>${escapeHtml(item.label)}</option>`)
    .join('');

  return `
    <article class="entity-card">
      <div class="entity-header">
        <strong>${escapeHtml(user.name)}</strong>
        <span>${escapeHtml(user.username)}</span>
      </div>
      <div class="entity-meta">
        <span class="badge ${roleBadge}">${escapeHtml(translatedRole)}</span>
        <span class="badge ${stateBadge}">${user.active ? t('dashboard.active') : t('dashboard.inactive')}</span>
        <span class="badge">${user.mustChangePassword ? t('dashboard.forcePassword') : t('dashboard.normalPassword')}</span>
      </div>
      <form class="form-inline user-edit-form" data-id="${user.id}">
        <input name="name" value="${escapeHtml(user.name)}" required>
        <input name="username" value="${escapeHtml(user.username)}" required>
        <select name="role">${roleOptions}</select>
        <select name="active">${activeOptions}</select>
        <select name="mustChangePassword">${passwordOptions}</select>
        <input name="password" placeholder="${t('dashboard.newPasswordPlaceholder')}">
        <button class="btn btn-small" type="submit">${t('dashboard.save')}</button>
        <button class="btn btn-small btn-danger" type="button" data-delete-id="${user.id}">${t('ui.delete')}</button>
      </form>
    </article>
  `;
}

function classRow(lesson) {
  const contentText = (lesson.content || [])
    .map((item) => `${item.spanish}|${item.english}`)
    .join('\n');
  const translatedTitle = translateClassTitle(lesson.title);
  const translatedCategory = translateClassCategory(lesson.category);
  const translatedLevel = translateClassLevel(lesson.level);

  return `
    <article class="entity-card">
      <div class="entity-header">
        <strong>${escapeHtml(translatedTitle)}</strong>
        <span>${escapeHtml(translatedCategory)} - ${escapeHtml(translatedLevel)}</span>
      </div>
      <form class="form-stack class-edit-form" data-id="${lesson.id}">
        <input name="title" value="${escapeHtml(lesson.title)}" required>
        <input name="category" value="${escapeHtml(lesson.category)}" required>
        <input name="level" value="${escapeHtml(lesson.level)}" required>
        <textarea name="content" rows="4" required>${escapeHtml(contentText)}</textarea>
        <div class="form-inline">
          <button class="btn btn-small" type="submit">${t('dashboard.save')}</button>
          <button class="btn btn-small btn-danger" type="button" data-delete-class-id="${lesson.id}">${t('ui.delete')}</button>
        </div>
      </form>
    </article>
  `;
}

async function loadUsers(page = 1) {
  currentUsersPage = page;
  const result = await apiJson(`/api/users?page=${page}&limit=20`);
  if (!result) return;

  const { data: users, pagination } = result.data;
  usersList.innerHTML = users.map(userRow).join('');

  // Render pagination
  let paginationHtml = '';
  if (pagination && pagination.pages > 1) {
    paginationHtml = '<div class="pagination" style="margin-top:0.8rem;">';
    paginationHtml += `<button ${pagination.page <= 1 ? 'disabled' : ''} data-upage="${pagination.page - 1}">&laquo;</button>`;
    for (let i = Math.max(1, pagination.page - 2); i <= Math.min(pagination.pages, pagination.page + 2); i++) {
      paginationHtml += `<button class="${i === pagination.page ? 'active' : ''}" data-upage="${i}">${i}</button>`;
    }
    paginationHtml += `<button ${pagination.page >= pagination.pages ? 'disabled' : ''} data-upage="${pagination.page + 1}">&raquo;</button>`;
    paginationHtml += '</div>';
  }
  usersList.insertAdjacentHTML('beforeend', paginationHtml);

  usersList.querySelectorAll('button[data-upage]').forEach((btn) => {
    btn.addEventListener('click', () => loadUsers(parseInt(btn.dataset.upage)));
  });

  usersList.querySelectorAll('.user-edit-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());
      body.active = body.active === 'true';
      body.mustChangePassword = body.mustChangePassword === 'true';
      if (!body.password) delete body.password;

      const updateResult = await apiJson(`/api/users/${form.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!updateResult) return;
      showToast(updateResult.ok ? t('dashboard.userUpdated') : (updateResult.data.message || 'Error'), updateResult.ok ? 'success' : 'error');
      await Promise.all([loadUsers(page), loadStats()]);
    });
  });

  usersList.querySelectorAll('button[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm(t('dashboard.deleteUserConfirm'))) return;
      const delResult = await apiJson(`/api/users/${button.dataset.deleteId}`, { method: 'DELETE' });
      if (!delResult) return;
      showToast(delResult.ok ? t('dashboard.userDeleted') : (delResult.data.message || 'Error'), delResult.ok ? 'success' : 'error');
      await Promise.all([loadUsers(page), loadStats()]);
    });
  });
}

async function loadClasses(page = 1) {
  currentClassesPage = page;
  const result = await apiJson(`/api/classes?page=${page}&limit=20`);
  if (!result) return;

  const { data: classes, pagination } = result.data;
  classesList.innerHTML = classes.map(classRow).join('');

  renderPagination('classes-pagination', pagination, loadClasses);

  classesList.querySelectorAll('.class-edit-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());

      const updateResult = await apiJson(`/api/classes/${form.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!updateResult) return;
      showToast(updateResult.ok ? t('dashboard.classUpdated') : (updateResult.data.message || 'Error'), updateResult.ok ? 'success' : 'error');
      await Promise.all([loadClasses(page), loadStats()]);
    });
  });

  classesList.querySelectorAll('button[data-delete-class-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm(t('dashboard.deleteClassConfirm'))) return;
      const delResult = await apiJson(`/api/classes/${button.dataset.deleteClassId}`, { method: 'DELETE' });
      if (!delResult) return;
      showToast(delResult.ok ? t('dashboard.classDeleted') : (delResult.data.message || 'Error'), delResult.ok ? 'success' : 'error');
      await Promise.all([loadClasses(page), loadStats()]);
    });
  });
}

createUserForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(createUserForm);
  const body = Object.fromEntries(formData.entries());

  const submitBtn = createUserForm.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const result = await apiJson('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  setButtonLoading(submitBtn, false);

  if (!result) return;
  showToast(result.ok ? t('dashboard.userCreated') : (result.data.message || 'Error'), result.ok ? 'success' : 'error');

  if (result.ok) {
    createUserForm.reset();
    await Promise.all([loadUsers(), loadStats()]);
  }
});

createClassForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(createClassForm);
  const body = Object.fromEntries(formData.entries());

  const submitBtn = createClassForm.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const result = await apiJson('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  setButtonLoading(submitBtn, false);

  if (!result) return;
  showToast(result.ok ? t('dashboard.classCreated') : (result.data.message || 'Error'), result.ok ? 'success' : 'error');

  if (result.ok) {
    createClassForm.reset();
    await Promise.all([loadClasses(), loadStats()]);
  }
});

csvImportForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fileInput = csvImportForm.querySelector('input[type="file"]');
  if (!fileInput.files.length) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  const submitBtn = csvImportForm.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const result = await apiJson('/api/classes/import-csv', {
    method: 'POST',
    body: formData,
  });

  setButtonLoading(submitBtn, false);

  if (!result) return;
  showToast(result.ok ? result.data.message : (result.data.message || t('dashboard.importError')), result.ok ? 'success' : 'error');

  if (result.ok) {
    csvImportForm.reset();
    await Promise.all([loadClasses(), loadStats()]);
  }
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

window.addEventListener('languagechange', () => {
  Promise.all([loadStats(), loadPaidAccounts(), loadUsers(currentUsersPage), loadClasses(currentClassesPage)]);
});

smoothSectionNav();
Promise.all([loadStats(), loadPaidAccounts(), loadUsers(), loadClasses()]);
