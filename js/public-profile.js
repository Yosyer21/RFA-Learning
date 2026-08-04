// ═══════════════════════════════════════════════════════════
// RFA.Learning — Public Profile (/u/:username)
// Muestra el perfil público de un usuario sin autenticación.
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  function getInitials(name) {
    return String(name || '')
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  }

  function getUsernameFromPath() {
    const match = window.location.pathname.match(/^\/u\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function renderAvatar(user) {
    const container = document.getElementById('public-avatar-container');
    const initials = document.getElementById('public-initials');

    container.style.backgroundColor = user.avatarColor || '#6c5ce7';

    const hasPhoto = user.avatarUrl && user.avatarUrl.startsWith('data:image/');
    if (hasPhoto) {
      container.style.backgroundImage = `url(${user.avatarUrl})`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      initials.style.display = 'none';
    } else {
      container.style.backgroundImage = 'none';
      initials.style.display = '';
      initials.textContent = getInitials(user.name);
    }
  }

  function renderHeader(user) {
    document.getElementById('public-display-name').textContent = user.name || user.username;
    document.getElementById('public-username-display').textContent = '@' + user.username;

    const roleLabel = user.role === 'admin'
      ? t('profile.roleAdmin')
      : user.role === 'teacher'
        ? t('profile.roleTeacher')
        : t('profile.roleStudent');
    const badge = document.getElementById('public-role-badge');
    badge.textContent = roleLabel;
    badge.className = 'badge ' + (user.role === 'admin' ? 'badge-admin' : user.role === 'teacher' ? 'badge-teacher' : 'badge-student');

    // Bio
    const bio = document.getElementById('public-bio-display');
    if (user.bio) {
      bio.textContent = user.bio;
      bio.style.display = 'block';
    } else {
      bio.style.display = 'none';
    }

    // Miembro desde
    const memberSince = document.getElementById('public-member-since');
    if (user.createdAt) {
      const date = new Date(user.createdAt);
      if (!Number.isNaN(date.getTime())) {
        const formatted = date.toLocaleDateString(getCurrentLang() === 'en' ? 'en-US' : 'es-CR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        memberSince.textContent = t('profile.memberSince') + ' ' + formatted;
        memberSince.style.display = 'block';
      } else {
        memberSince.style.display = 'none';
      }
    } else {
      memberSince.style.display = 'none';
    }
  }

  function renderMiniStats(stats) {
    document.getElementById('public-mini-classes').textContent = stats.completedClasses || 0;
    document.getElementById('public-mini-quizzes').textContent = stats.totalQuizzes || 0;
    document.getElementById('public-mini-score').textContent = stats.score || 0;
  }

  function renderDetailedStats(stats) {
    document.getElementById('public-stat-accuracy').textContent = (stats.accuracy || 0) + '%';
    document.getElementById('public-stat-streak').textContent = stats.streak || 0;
    document.getElementById('public-stat-total-quizzes').textContent = stats.totalQuizzes || 0;
    document.getElementById('public-stat-level').textContent = t('classes.level' + (stats.currentLevel || 'Beginner')) || stats.currentLevel || '-';
  }

  function renderLevelProgress(levelProgress) {
    const container = document.getElementById('public-level-progress');
    if (!levelProgress || !levelProgress.length) {
      container.innerHTML = `<div class="empty-state">${t('home.noCompleted')}</div>`;
      return;
    }

    container.innerHTML = levelProgress.map((level) => {
      const label = t('classes.level' + level.level) || level.level;
      return `
        <div class="level-progress-item">
          <div class="level-progress-header">
            <span class="level-name">${escapeHtml(label)}</span>
            <span class="level-count">${level.completed}/${level.total}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width:${level.percentage}%"></div>
          </div>
        </div>`;
    }).join('');
  }

  function renderAchievements(achievements) {
    const container = document.getElementById('public-achievements');
    if (!achievements || !achievements.length) {
      container.innerHTML = `<div class="empty-state">${t('home.achievementsEmpty')}</div>`;
      return;
    }

    container.innerHTML = achievements.map((a) => {
      const title = getCurrentLang() === 'en' ? (a.titleEn || a.titleEs) : (a.titleEs || a.titleEn);
      const desc = getCurrentLang() === 'en' ? (a.descEn || a.descEs) : (a.descEs || a.descEn);
      return `
        <div class="achievement-card achievement-unlocked">
          <div class="achievement-icon">${escapeHtml(a.icon || '★')}</div>
          <div class="achievement-info">
            <strong>${escapeHtml(title)}</strong>
            <small>${escapeHtml(desc)}</small>
          </div>
        </div>`;
    }).join('');
  }

  function showError(message) {
    const status = document.getElementById('public-profile-status');
    status.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  async function loadPublicProfile() {
    const username = getUsernameFromPath();
    if (!username) {
      showError(t('profile.notFound'));
      return;
    }

    const result = await apiJson('/api/public/profile/' + encodeURIComponent(username));

    if (!result || !result.ok) {
      const msg = result?.status === 404 ? t('profile.notFound') : (result?.data?.message || t('ui.connectionError'));
      showError(msg);
      return;
    }

    const data = result.data;
    if (!data || !data.user) {
      showError(t('profile.notFound'));
      return;
    }

    // Ocultar estado de carga y mostrar contenido
    document.getElementById('public-profile-status').hidden = true;
    document.getElementById('public-profile-content').hidden = false;

    renderAvatar(data.user);
    renderHeader(data.user);
    renderMiniStats(data.stats);
    renderDetailedStats(data.stats);
    renderLevelProgress(data.levelProgress);
    renderAchievements(data.achievements);

    // Actualizar título de la página
    document.title = (data.user.name || data.user.username) + ' | RFA.Learning';
  }

  window.addEventListener('languagechange', () => {
    // Recargar para re-renderizar con el nuevo idioma
    loadPublicProfile();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPublicProfile);
  } else {
    loadPublicProfile();
  }
})();
