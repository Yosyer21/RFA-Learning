function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t('home.greetMorning');
  if (h < 19) return t('home.greetAfternoon');
  return t('home.greetEvening');
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
          <span>${translateClassLevel(level)}</span>
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
    list.innerHTML = `<li class="empty-state">${t('home.noCompleted')}</li>`;
    return;
  }

  list.innerHTML = done.map(c => `
    <li>
      <span class="check-icon"></span>
      <span class="class-name">${escapeHtml(translateClassTitle(c.title))}</span>
      <span class="class-badge">${translateClassLevel(c.level)}</span>
    </li>`).join('');
}

async function loadHome() {
  showLoading();
  const meResult = await apiJson('/api/auth/me');
  if (!meResult) { hideLoading(); return; }

  const name = meResult.data.user.name;
  document.getElementById('welcome').textContent = `${getGreeting()}, ${name}`;

  // Fetch progress & classes in parallel
  const [progressRes, classesRes] = await Promise.all([
    apiJson('/api/classes/progress'),
    apiJson('/api/classes'),
  ]);

  hideLoading();

  const progress = progressRes?.data || {};
  const classes = classesRes?.data?.data || classesRes?.data || [];

  const classesArray = Array.isArray(classes) ? classes : [];
  const completedIds = progress.completedClasses || [];
  const totalClasses = classesArray.length || 1;
  const pct = Math.round((completedIds.length / totalClasses) * 100);

  // Stat cards
  document.getElementById('stat-level').textContent = translateClassLevel(progress.currentLevel || 'Beginner');
  document.getElementById('stat-completed').textContent = completedIds.length;
  document.getElementById('stat-score').textContent = progress.score ?? 0;
  document.getElementById('stat-streak').textContent = progress.streak ?? 0;

  // Ring
  setRingProgress(pct);

  // Level bars
  renderLevelBars(classesArray, completedIds);

  // Completed list
  renderCompletedList(classesArray, completedIds);
}

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

window.addEventListener('languagechange', () => {
  loadHome();
});

loadHome();
