let currentUser = null;
let homeData = null;

async function loadProfile() {
  const meResult = await apiJson('/api/auth/me');
  if (!meResult) return;

  currentUser = meResult.data.user;

  // Header info
  document.getElementById('profile-display-name').textContent = currentUser.name || currentUser.username;
  document.getElementById('profile-username-display').textContent = '@' + currentUser.username;
  document.getElementById('profile-initials').textContent = getInitials(currentUser.name || currentUser.username);

  // Avatar color
  const avatarContainer = document.getElementById('profile-avatar-container');
  avatarContainer.style.backgroundColor = currentUser.avatarColor || '#6c5ce7';

  // Bio
  const bioDisplay = document.getElementById('profile-bio-display');
  if (currentUser.bio) {
    bioDisplay.textContent = currentUser.bio;
    bioDisplay.style.display = 'block';
  } else {
    bioDisplay.style.display = 'none';
  }

  const roleLabel = currentUser.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleStudent');
  const badge = document.getElementById('profile-role-badge');
  badge.textContent = roleLabel;
  badge.className = 'badge ' + (currentUser.role === 'admin' ? 'badge-admin' : 'badge-student');

  // Form fields
  document.getElementById('profile-name').value = currentUser.name || '';
  document.getElementById('profile-username').value = currentUser.username;
  document.getElementById('profile-role').value = roleLabel;
  document.getElementById('profile-email').value = currentUser.email || currentUser.username;

  // Avatar color input
  document.getElementById('avatar-color-input').value = currentUser.avatarColor || '#6c5ce7';

  // Bio textarea
  document.getElementById('profile-bio').value = currentUser.bio || '';
  document.getElementById('bio-char-count').textContent = (currentUser.bio || '').length;

  // Preferences
  document.getElementById('preferred-voice').value = currentUser.preferredVoice || 'english';
  document.getElementById('preferred-theme').value = currentUser.preferredTheme || 'dark';

  // Load quiz history + stats
  const [historyResult, homeDataResult] = await Promise.all([
    apiJson('/api/classes/quiz/history'),
    apiJson('/api/classes/home-data'),
  ]);

  homeData = homeDataResult?.data || null;

  // Mini stats
  if (homeData) {
    const d = homeData;
    document.getElementById('mini-classes').textContent = d.completedIds?.length || 0;
    document.getElementById('mini-quizzes').textContent = d.quizStats?.totalQuizzes || 0;
    document.getElementById('mini-score').textContent = d.progress?.score || 0;
  }

  // Detailed stats
  renderDetailedStats(homeData);
  renderLevelProgress(homeData);
  renderAchievements(homeData);

  // Quiz history
  renderQuizHistory(historyResult);
}

function renderDetailedStats(data) {
  if (!data) return;

  const stats = data.quizStats || {};
  const accuracy = stats.accuracy || 0;
  const totalQuizzes = stats.totalQuizzes || 0;

  document.getElementById('stat-accuracy').textContent = accuracy + '%';
  document.getElementById('stat-total-quizzes').textContent = totalQuizzes;

  // Calculate passed quizzes from history
  const passed = (data.lastQuizzes || []).filter(q => q.total > 0 && (q.score / q.total) >= 0.7).length;
  document.getElementById('stat-passed').textContent = passed;

  // Streak (simplified - count consecutive days from quiz history)
  const streak = calculateStreak(data.lastQuizzes || []);
  document.getElementById('stat-streak').textContent = streak;
}

function calculateStreak(quizzes) {
  if (!quizzes.length) return 0;

  const dates = quizzes.map(q => {
    const d = new Date(q.completedAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const uniqueDates = [...new Set(dates)].sort().reverse();
  if (!uniqueDates.length) return 0;

  let streak = 1;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Check if most recent date is today or yesterday
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function renderLevelProgress(data) {
  const container = document.getElementById('level-progress-container');
  if (!data || !data.levelProgress) {
    container.innerHTML = `<div class="empty-state">${t('home.noCompleted')}</div>`;
    return;
  }

  const lp = data.levelProgress;
  const levels = [
    { key: 'Beginner', label: t('classes.levelBeginner') },
    { key: 'Intermediate', label: t('classes.levelIntermediate') },
    { key: 'Advanced', label: t('classes.levelAdvanced') },
  ];

  container.innerHTML = levels.map(level => {
    const classesInLevel = data.allClasses?.filter(c => c.level === level.key).length || 0;
    const completedInLevel = data.completedIds?.filter(id => {
      const cls = data.allClasses?.find(c => c.id === id);
      return cls && cls.level === level.key;
    }).length || 0;
    const pct = classesInLevel > 0 ? Math.round((completedInLevel / classesInLevel) * 100) : 0;
    const isCurrent = lp.currentLevel === level.key;

    return `
      <div class="level-progress-item ${isCurrent ? 'current' : ''}">
        <div class="level-progress-header">
          <span class="level-name">${level.label}</span>
          <span class="level-count">${completedInLevel}/${classesInLevel}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderAchievements(data) {
  const container = document.getElementById('profile-achievements');
  if (!data) {
    container.innerHTML = `<div class="empty-state">${t('home.achievementsEmpty')}</div>`;
    return;
  }

  const allAchievements = [
    ...(data.achievements || []),
    ...(data.lockedAchievements || []),
  ];

  if (!allAchievements.length) {
    container.innerHTML = `<div class="empty-state">${t('home.achievementsEmpty')}</div>`;
    return;
  }

  container.innerHTML = allAchievements.map(a => {
    const unlockedClass = a.unlocked ? 'achievement-unlocked' : 'achievement-locked';
    const progressHtml = !a.unlocked && a.target ? `
      <div class="achievement-progress-bar">
        <div class="achievement-progress-fill" style="width:${Math.round((a.progress / a.target) * 100)}%"></div>
      </div>
      <small>${a.progress}/${a.target}</small>
    ` : '';

    return `
      <div class="achievement-card ${unlockedClass}">
        <div class="achievement-icon">${a.icon || '★'}</div>
        <div class="achievement-info">
          <strong>${getCurrentLang() === 'en' ? (a.titleEn || a.titleEs) : (a.titleEs || a.titleEn)}</strong>
          <small>${getCurrentLang() === 'en' ? (a.descEn || a.descEs) : (a.descEs || a.descEn)}</small>
          ${progressHtml}
        </div>
      </div>`;
  }).join('');
}

function renderQuizHistory(historyResult) {
  const container = document.getElementById('quiz-history');

  if (!historyResult || !historyResult.data.length) {
    container.innerHTML = `<div class="empty-state">${t('profile.noQuizzes')}</div>`;
    return;
  }

  container.innerHTML = historyResult.data.map((q) => {
    const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
    const status = pct >= 70 ? 'passed' : 'failed';
    const date = new Date(q.completedAt).toLocaleDateString(getCurrentLang() === 'en' ? 'en-US' : 'es-CR');
    return `
      <div class="quiz-history-item">
        <span class="quiz-history-icon ${status}">${status === 'passed' ? 'OK' : 'NO'}</span>
        <div class="quiz-history-body">
          <strong>${escapeHtml(translateClassTitle(q.classTitle))}</strong>
          <small>${date}</small>
        </div>
        <span class="quiz-history-score ${status}">${q.score}/${q.total} (${pct}%)</span>
      </div>`;
  }).join('');
}

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

// ── Save name ──
document.getElementById('profile-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const nameInput = document.getElementById('profile-name');

  if (!validateField(nameInput, { required: true, requiredMessage: t('profile.nameRequired') })) return;

  const submitBtn = event.target.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const result = await apiJson('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nameInput.value.trim() }),
  });

  setButtonLoading(submitBtn, false);

  if (result?.ok) {
    showToast(t('profile.updated'), 'success');
    loadProfile(); // refresh
  } else {
    showToast(result?.data?.message || t('profile.updateError'), 'error');
  }
});

// ── Avatar color presets ──
document.querySelectorAll('.color-preset').forEach(btn => {
  btn.addEventListener('click', async () => {
    const color = btn.dataset.color;
    document.getElementById('avatar-color-input').value = color;
    document.getElementById('profile-avatar-container').style.backgroundColor = color;

    const result = await apiJson('/api/auth/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarColor: color }),
    });

    if (result?.ok) {
      showToast(t('profile.preferencesSaved'), 'success');
    } else {
      showToast(t('profile.preferencesError'), 'error');
    }
  });
});

// ── Avatar color from input ──
document.getElementById('avatar-color-input')?.addEventListener('change', async (e) => {
  const color = e.target.value;
  document.getElementById('profile-avatar-container').style.backgroundColor = color;

  const result = await apiJson('/api/auth/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatarColor: color }),
  });

  if (result?.ok) {
    showToast(t('profile.preferencesSaved'), 'success');
  } else {
    showToast(t('profile.preferencesError'), 'error');
  }
});

// ── Bio char counter ──
document.getElementById('profile-bio')?.addEventListener('input', (e) => {
  document.getElementById('bio-char-count').textContent = e.target.value.length;
});

// ── Save bio ──
document.getElementById('save-bio-btn')?.addEventListener('click', async () => {
  const bio = document.getElementById('profile-bio').value.trim();

  const result = await apiJson('/api/auth/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio }),
  });

  if (result?.ok) {
    showToast(t('profile.bioSaved'), 'success');
    loadProfile();
  } else {
    showToast(t('profile.preferencesError'), 'error');
  }
});

// ── Save preferences (voice, theme) ──
document.getElementById('save-preferences-btn')?.addEventListener('click', async () => {
  const preferredVoice = document.getElementById('preferred-voice').value;
  const preferredTheme = document.getElementById('preferred-theme').value;

  const result = await apiJson('/api/auth/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferredVoice, preferredTheme }),
  });

  if (result?.ok) {
    showToast(t('profile.preferencesSaved'), 'success');

    // Apply theme immediately
    if (preferredTheme === 'light') {
      document.body.classList.add('light-mode');
      document.documentElement.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
      document.documentElement.classList.remove('light-mode');
    }

    // Save voice preference to localStorage for classes page
    localStorage.setItem('rfa-voice', preferredVoice);
  } else {
    showToast(t('profile.preferencesError'), 'error');
  }
});

// ── Logout ──
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

window.addEventListener('languagechange', () => {
  loadProfile();
});

loadProfile();
