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

function renderXpBar(levelProgress) {
  const label = document.getElementById('xp-level-label');
  const nextLabel = document.getElementById('xp-next-label');
  const fill = document.getElementById('xp-bar-fill');
  const progressText = document.getElementById('xp-progress-text');
  const classesText = document.getElementById('xp-classes-text');

  if (!label || !fill) return;

  const current = translateClassLevel(levelProgress.currentLevel);
  const next = levelProgress.nextLevel ? translateClassLevel(levelProgress.nextLevel) : 'Max';
  const pct = levelProgress.progress || 0;

  label.textContent = `${t('home.xpTitle')}: ${current}`;
  if (nextLabel) {
    nextLabel.textContent = `${t('home.xpNext')}: ${next}`;
  }
  fill.style.width = `${pct}%`;
  progressText.textContent = `${pct}%`;
  classesText.textContent = `${levelProgress.completedInLevel || 0} ${t('home.of')} ${levelProgress.classesInLevel || 0} ${t('home.xpClasses')}`;
}

function renderRecommendedClass(recommendedClass) {
  const section = document.getElementById('recommended-section');
  const card = document.getElementById('recommended-card');
  if (!section || !card) return;

  if (!recommendedClass) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  const categoryIcon = getCategoryIcon(recommendedClass.category);
  const levelBadge = translateClassLevel(recommendedClass.level);
  const contentCount = Array.isArray(recommendedClass.content) ? recommendedClass.content.length : 0;

  card.innerHTML = `
    <div class="recommended-card-icon">${categoryIcon}</div>
    <div class="recommended-card-body">
      <h4>${escapeHtml(translateClassTitle(recommendedClass.title))}</h4>
      <p>${levelBadge} · ${contentCount} ${t('classes.termsLabel').replace('{0}', contentCount)}</p>
    </div>
    <div class="recommended-card-action">
      <a href="/clases" class="btn btn-small btn-modern btn-modern-primary">${t('home.recommendedAction')}</a>
    </div>
  `;
}

function renderContinueLearning(uncompletedClasses) {
  const container = document.getElementById('continue-list');
  if (!container) return;

  if (!uncompletedClasses || uncompletedClasses.length === 0) {
    container.innerHTML = `<div class="empty-state">${t('home.continueEmpty')}</div>`;
    return;
  }

  container.innerHTML = uncompletedClasses.map(c => {
    const icon = getCategoryIcon(c.category);
    const levelBadge = translateClassLevel(c.level);
    const contentCount = Array.isArray(c.content) ? c.content.length : 0;
    return `
      <a href="/clases" class="continue-item">
        <div class="continue-item-icon">${icon}</div>
        <div class="continue-item-body">
          <strong>${escapeHtml(translateClassTitle(c.title))}</strong>
          <small>${levelBadge} · ${contentCount} ${t('classes.termsLabel').replace('{0}', contentCount)}</small>
        </div>
        <span class="btn btn-small btn-ghost">${t('home.continueAction')}</span>
      </a>`;
  }).join('');
}

function renderWeeklyChart(weeklyActivity) {
  const container = document.getElementById('weekly-chart');
  if (!container) return;

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const isEn = getCurrentLang() === 'en';
  const dayLabels = isEn ? dayNamesEn : days;

  // Build map of last 7 days
  const today = new Date();
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = dayLabels[d.getDay()];
    const entry = weeklyActivity.find(w => {
      const wDate = typeof w.day === 'string' ? w.day.slice(0, 10) : '';
      return wDate === dateStr;
    });
    weekData.push({
      label: dayName,
      count: entry ? parseInt(entry.count) || 0 : 0,
    });
  }

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  if (weekData.every(d => d.count === 0)) {
    container.innerHTML = `<div class="weekly-empty">${t('home.weeklyEmpty')}</div>`;
    return;
  }

  container.innerHTML = weekData.map(d => {
    const height = Math.max(4, (d.count / maxCount) * 100);
    return `
      <div class="weekly-bar-wrap">
        <span class="weekly-bar-value">${d.count}</span>
        <div class="weekly-bar" style="height:${height}%"></div>
        <span class="weekly-bar-label">${d.label}</span>
      </div>`;
  }).join('');
}

function renderAchievements(achievements, lockedAchievements) {
  const container = document.getElementById('achievements-list');
  if (!container) return;

  const allItems = [...(achievements || []), ...(lockedAchievements || [])];

  if (allItems.length === 0) {
    container.innerHTML = `<div class="empty-state">${t('home.achievementsEmpty')}</div>`;
    return;
  }

  const isEn = getCurrentLang() === 'en';

  container.innerHTML = allItems.map(a => {
    const title = isEn ? a.titleEn : a.titleEs;
    const desc = isEn ? a.descEn : a.descEs;
    const lockedClass = a.unlocked === false ? 'locked' : '';
    const progressHtml = a.unlocked === false && a.target
      ? `<div class="achievement-progress"><div class="achievement-progress-fill" style="width:${Math.round((a.progress / a.target) * 100)}%"></div></div>`
      : '';
    return `
      <div class="achievement-item ${lockedClass}">
        <span class="achievement-icon">${a.icon}</span>
        <span class="achievement-title">${escapeHtml(title)}</span>
        <span class="achievement-desc">${escapeHtml(desc)}</span>
        ${progressHtml}
      </div>`;
  }).join('');
}

function renderQuizHistory(lastQuizzes) {
  const container = document.getElementById('quiz-history-list');
  if (!container) return;

  if (!lastQuizzes || lastQuizzes.length === 0) {
    container.innerHTML = `<div class="empty-state">${t('home.quizHistoryEmpty')}</div>`;
    return;
  }

  container.innerHTML = lastQuizzes.map(q => {
    const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
    const passed = pct >= 70;
    const date = q.completedAt ? new Date(q.completedAt).toLocaleDateString() : '';
    return `
      <div class="quiz-history-item">
        <span class="quiz-history-icon ${passed ? 'passed' : 'failed'}">${passed ? 'P' : 'F'}</span>
        <div class="quiz-history-body">
          <strong>${escapeHtml(translateClassTitle(q.classTitle))}</strong>
          <small>${date}</small>
        </div>
        <span class="quiz-history-score ${passed ? 'passed' : 'failed'}">${q.score}/${q.total}</span>
      </div>`;
  }).join('');
}

function getCategoryIcon(category) {
  const icons = {
    'Posiciones': 'P',
    'Acciones': 'A',
    'Arbitraje': 'R',
    'Táctica': 'T',
    'Análisis': 'S',
    'Comunicación': 'C',
    'Historia': 'H',
    'Reglas': 'L',
    'Leyendas': 'G',
    'Competiciones': 'M',
    'Equipamiento': 'E',
    'Cultura': 'F',
  };
  return icons[category] || 'B';
}

async function loadHome() {
  showLoading();
  const meResult = await apiJson('/api/auth/me');
  if (!meResult) { hideLoading(); return; }

  const name = meResult.data.user.name;
  document.getElementById('welcome').textContent = `${getGreeting()}, ${name}`;

  // Fetch all data from new consolidated endpoint
  const [homeDataRes, classesRes] = await Promise.all([
    apiJson('/api/classes/home-data'),
    apiJson('/api/classes'),
  ]);

  hideLoading();

  const homeData = homeDataRes?.data || {};
  const classes = classesRes?.data?.data || classesRes?.data || [];
  const classesArray = Array.isArray(classes) ? classes : [];
  const completedIds = homeData.completedIds || [];
  const progress = homeData.progress || {};

  // Stat cards
  document.getElementById('stat-level').textContent = translateClassLevel(progress.currentLevel || 'Beginner');
  document.getElementById('stat-completed').textContent = completedIds.length;
  document.getElementById('stat-score').textContent = progress.score ?? 0;
  document.getElementById('stat-streak').textContent = progress.streak ?? 0;

  // XP / Level bar
  if (homeData.levelProgress) {
    renderXpBar(homeData.levelProgress);
  }

  // Recommended class
  renderRecommendedClass(homeData.recommendedClass);

  // Continue learning
  renderContinueLearning(homeData.uncompletedClasses);

  // Weekly chart
  renderWeeklyChart(homeData.weeklyActivity || []);

  // Achievements
  renderAchievements(homeData.achievements, homeData.lockedAchievements);

  // Quiz history
  renderQuizHistory(homeData.lastQuizzes);

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
