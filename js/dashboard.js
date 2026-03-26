const statsData = document.getElementById('stats-data');
const statsCards = document.getElementById('stats-cards');
const usersList = document.getElementById('users-list');
const classesList = document.getElementById('classes-list');
const createUserForm = document.getElementById('create-user-form');
const createClassForm = document.getElementById('create-class-form');
const userMessage = document.getElementById('user-message');
const classMessage = document.getElementById('class-message');

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

async function secureFetch(url, options) {
  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    window.location.href = '/login';
    return null;
  }

  return response;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (_error) {
    return { message: 'Unexpected response' };
  }
}

async function loadStats() {
  const response = await secureFetch('/api/admin/stats');
  if (!response) return;

  const data = await readJson(response);
  const items = [
    ['Usuarios', data.totalUsers ?? 0],
    ['Admins', data.totalAdmins ?? 0],
    ['Students', data.totalStudents ?? 0],
    ['Activos', data.activeStudents ?? 0],
    ['Clases', data.totalClasses ?? 0],
    ['Registros progreso', data.progressRecords ?? 0],
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

function userRow(user) {
  const roleBadge = user.role === 'admin' ? 'badge-admin' : 'badge-student';
  const stateBadge = user.active ? 'badge-active' : 'badge-inactive';

  return `
    <article class="entity-card">
      <div class="entity-header">
        <strong>${user.name}</strong>
        <span>${user.username}</span>
      </div>
      <div class="entity-meta">
        <span class="badge ${roleBadge}">${user.role}</span>
        <span class="badge ${stateBadge}">${user.active ? 'activo' : 'inactivo'}</span>
        <span class="badge">${user.mustChangePassword ? 'forzar password' : 'password normal'}</span>
      </div>
      <form class="form-inline user-edit-form" data-id="${user.id}">
        <input name="name" value="${user.name}" required>
        <input name="username" value="${user.username}" required>
        <select name="role">
          <option value="student" ${user.role === 'student' ? 'selected' : ''}>student</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
        </select>
        <select name="active">
          <option value="true" ${user.active ? 'selected' : ''}>activo</option>
          <option value="false" ${!user.active ? 'selected' : ''}>inactivo</option>
        </select>
        <select name="mustChangePassword">
          <option value="false" ${!user.mustChangePassword ? 'selected' : ''}>normal</option>
          <option value="true" ${user.mustChangePassword ? 'selected' : ''}>forzar password</option>
        </select>
        <input name="password" placeholder="Nueva contrasena (opcional)">
        <button class="btn btn-small" type="submit">Guardar</button>
        <button class="btn btn-small btn-danger" type="button" data-delete-id="${user.id}">Eliminar</button>
      </form>
    </article>
  `;
}

function classRow(lesson) {
  const contentText = (lesson.content || [])
    .map((item) => `${item.spanish}|${item.english}`)
    .join('\n');

  return `
    <article class="entity-card">
      <div class="entity-header">
        <strong>${lesson.title}</strong>
        <span>${lesson.category} - ${lesson.level}</span>
      </div>
      <form class="form-stack class-edit-form" data-id="${lesson.id}">
        <input name="title" value="${lesson.title}" required>
        <input name="category" value="${lesson.category}" required>
        <input name="level" value="${lesson.level}" required>
        <textarea name="content" rows="4" required>${contentText}</textarea>
        <div class="form-inline">
          <button class="btn btn-small" type="submit">Guardar</button>
          <button class="btn btn-small btn-danger" type="button" data-delete-class-id="${lesson.id}">Eliminar</button>
        </div>
      </form>
    </article>
  `;
}

async function loadUsers() {
  const response = await secureFetch('/api/users');
  if (!response) return;

  const users = await readJson(response);
  usersList.innerHTML = users.map(userRow).join('');

  usersList.querySelectorAll('.user-edit-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());
      body.active = body.active === 'true';
      body.mustChangePassword = body.mustChangePassword === 'true';
      if (!body.password) delete body.password;

      const updateResponse = await secureFetch(`/api/users/${form.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!updateResponse) return;
      const updateData = await readJson(updateResponse);
      userMessage.textContent = updateResponse.ok ? 'Usuario actualizado' : (updateData.message || 'Error al actualizar usuario');
      await Promise.all([loadUsers(), loadStats()]);
    });
  });

  usersList.querySelectorAll('button[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const delResponse = await secureFetch(`/api/users/${button.dataset.deleteId}`, { method: 'DELETE' });
      if (!delResponse) return;

      const delData = await readJson(delResponse);
      userMessage.textContent = delResponse.ok ? 'Usuario eliminado' : (delData.message || 'Error al eliminar usuario');
      await Promise.all([loadUsers(), loadStats()]);
    });
  });
}

async function loadClasses() {
  const response = await secureFetch('/api/classes');
  if (!response) return;

  const classes = await readJson(response);
  classesList.innerHTML = classes.map(classRow).join('');

  classesList.querySelectorAll('.class-edit-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());

      const updateResponse = await secureFetch(`/api/classes/${form.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!updateResponse) return;
      const updateData = await readJson(updateResponse);
      classMessage.textContent = updateResponse.ok ? 'Clase actualizada' : (updateData.message || 'Error al actualizar clase');
      await Promise.all([loadClasses(), loadStats()]);
    });
  });

  classesList.querySelectorAll('button[data-delete-class-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const delResponse = await secureFetch(`/api/classes/${button.dataset.deleteClassId}`, { method: 'DELETE' });
      if (!delResponse) return;

      const delData = await readJson(delResponse);
      classMessage.textContent = delResponse.ok ? 'Clase eliminada' : (delData.message || 'Error al eliminar clase');
      await Promise.all([loadClasses(), loadStats()]);
    });
  });
}

createUserForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(createUserForm);
  const body = Object.fromEntries(formData.entries());

  const response = await secureFetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response) return;

  const data = await readJson(response);
  userMessage.textContent = response.ok ? 'Usuario creado' : (data.message || 'Error al crear usuario');

  if (response.ok) {
    createUserForm.reset();
    await Promise.all([loadUsers(), loadStats()]);
  }
});

createClassForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(createClassForm);
  const body = Object.fromEntries(formData.entries());

  const response = await secureFetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response) return;

  const data = await readJson(response);
  classMessage.textContent = response.ok ? 'Clase creada' : (data.message || 'Error al crear clase');

  if (response.ok) {
    createClassForm.reset();
    await Promise.all([loadClasses(), loadStats()]);
  }
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

smoothSectionNav();
Promise.all([loadStats(), loadUsers(), loadClasses()]);
