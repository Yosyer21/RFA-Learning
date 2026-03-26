function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos dias';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function setRingProgress(pct) {
  const circle = document.querySelector('.progress-ring-fill');
  if (!circle) return;
  const r = 52;
  const circumference = 2 * Math.PI * r;
  circle.setAttribute('stroke-dasharray', circumference);
  // small delay so the transition is visible
  requestAnimationFrame(() => {
    circle.setAttribute('stroke-dashoffset', circumference - (circumference * pct) / 100);
  });
  document.getElementById('progress-pct').textContent = `${Math.round(pct)}%`;
}

function renderLevelBars(classes, completed) {
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const container = document.getElementById('level-bars');
  if (!container) return;

  container.innerHTML = levels.map(level => {
    const total = classes.filter(c => c.level === level).length;
    const done = classes.filter(c => c.level === level && completed.includes(c.id)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return `
      <div class="level-bar">
        <div class="level-bar-head">
          <span>${level}</span>
          <small>${done}/${total}</small>
        </div>
        <div class="level-bar-track">
          <div class="level-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderCompletedList(classes, completedIds) {
  const list = document.getElementById('completed-list');
  if (!list) return;

  const done = classes.filter(c => completedIds.includes(c.id));
  if (done.length === 0) {
    list.innerHTML = '<li class="empty-state">Sin clases completadas aun</li>';
    return;
  }

  list.innerHTML = done.map(c => `
    <li>
      <span class="check-icon"></span>
      <span class="class-name">${c.title}</span>
      <span class="class-badge">${c.level}</span>
    </li>`).join('');
}

async function loadHome() {
  const meResponse = await fetch('/api/auth/me');
  if (!meResponse.ok) {
    window.location.href = '/login';
    return;
  }

  const meData = await meResponse.json();
  const name = meData.user.name;
  document.getElementById('welcome').textContent = `${getGreeting()}, ${name}`;

  // Fetch progress & classes in parallel
  const [progressRes, classesRes] = await Promise.all([
    fetch('/api/classes/progress'),
    fetch('/api/classes')
  ]);

  const progress = await progressRes.json();
  const classes = await classesRes.json();

  const completedIds = progress.completedClasses || [];
  const totalClasses = classes.length || 1;
  const pct = Math.round((completedIds.length / totalClasses) * 100);

  // Stat cards
  document.getElementById('stat-level').textContent = progress.currentLevel || 'Beginner';
  document.getElementById('stat-completed').textContent = completedIds.length;
  document.getElementById('stat-score').textContent = progress.score ?? 0;
  document.getElementById('stat-streak').textContent = progress.streak ?? 0;

  // Ring
  setRingProgress(pct);

  // Level bars
  renderLevelBars(classes, completedIds);

  // Completed list
  renderCompletedList(classes, completedIds);
}

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

loadHome();
