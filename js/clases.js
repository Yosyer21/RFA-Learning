async function secureFetch(url, options) {
  const response = await fetch(url, options);
  if (response.status === 401 || response.status === 403) {
    window.location.href = '/login';
    return null;
  }
  return response;
}

async function loadClasses() {
  const meResponse = await secureFetch('/api/auth/me');
  if (!meResponse) return;
  const me = await meResponse.json();

  if (me.user.role === 'admin') {
    document.getElementById('dashboard-link').classList.remove('hidden');
  }

  const classesResponse = await secureFetch('/api/classes');
  if (!classesResponse) return;

  const classes = await classesResponse.json();
  const container = document.getElementById('classes-container');
  const summary = document.getElementById('classes-summary');
  summary.textContent = `${classes.length} modulo(s) disponible(s)`;

  container.innerHTML = classes
    .map(
      (lesson) => `
      <article class="class-card">
        <h3>${lesson.title}</h3>
        <p class="entity-meta">
          <span class="badge">${lesson.category}</span>
          <span class="badge">${lesson.level}</span>
        </p>
        <ul class="term-list">
          ${lesson.content
            .map((item) => `<li><span>${item.spanish}</span><strong>${item.english}</strong></li>`)
            .join('')}
        </ul>
      </article>
    `
    )
    .join('');
}

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

loadClasses();
