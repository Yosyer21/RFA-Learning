// ═══════════════════════════════════════════════════════════
// RFA.Learning — Meeting (Jitsi Meet)
// Página dedicada de videollamada de un aula.
// El profesor puede crear la reunión y los estudiantes unirse.
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  let classroomId = null;
  let isTeacher = false;
  let meeting = null;

  const lobby = document.getElementById('meeting-lobby');
  const stage = document.getElementById('meeting-stage');
  const startBtn = document.getElementById('meeting-start-btn');
  const startLabel = document.getElementById('meeting-start-label');
  const classroomName = document.getElementById('meeting-classroom-name');
  const classroomDesc = document.getElementById('meeting-classroom-desc');
  const roleBadge = document.getElementById('meeting-role-badge');
  const stageTitle = document.getElementById('meeting-stage-title');

  // Obtener el id del aula desde la URL (/meeting/:id)
  function getClassroomIdFromUrl() {
    const match = window.location.pathname.match(/^\/meeting\/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  // ── Cargar datos del aula y de la reunión ──
  async function loadMeeting() {
    const [classroomResult, meetingResult] = await Promise.all([
      apiJson(`/api/classrooms/${classroomId}`),
      apiJson(`/api/classrooms/${classroomId}/meeting`),
    ]);

    if (!classroomResult || !meetingResult) return;

    if (!classroomResult.ok || !meetingResult.ok) {
      showToast(
        (classroomResult.data?.message) || (meetingResult.data?.message) || 'Error',
        'error'
      );
      window.location.href = '/classrooms';
      return;
    }

    const c = classroomResult.data.data;
    meeting = meetingResult.data.data;
    isTeacher = !!meeting.isTeacher;

    if (classroomName) classroomName.textContent = c.name;
    if (classroomDesc) classroomDesc.textContent = c.description || '';
    if (stageTitle) stageTitle.textContent = c.name;

    // Etiqueta de rol
    if (roleBadge) {
      roleBadge.innerHTML = isTeacher
        ? `<span class="badge badge-teacher">${t('meeting.teacher')}</span>`
        : `<span class="badge">${t('meeting.student')}</span>`;
    }

    // El profesor puede crear la reunión; el estudiante se une
    if (startLabel) {
      startLabel.textContent = isTeacher ? t('meeting.create') : t('meeting.join');
      startLabel.setAttribute('data-i18n', isTeacher ? 'meeting.create' : 'meeting.join');
    }
  }

  // ── Iniciar la videollamada (crear o unirse) ──
  async function startMeeting() {
    if (!meeting) return;

    // Registrar el inicio de la reunión (solo el profesor crea el registro)
    if (isTeacher) {
      await apiJson(`/api/classrooms/${classroomId}/meeting/start`, { method: 'POST' });
    }


    // Ocultar lobby y mostrar el escenario de la videollamada
    if (lobby) lobby.style.display = 'none';
    if (stage) stage.style.display = '';

    const container = document.getElementById('jitsi-container');
    if (!container) return;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('allow', 'camera; microphone; fullscreen; display-capture; autoplay');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.src = `https://${meeting.domain}/${meeting.roomName}#userInfo.displayName=${encodeURIComponent(meeting.displayName)}&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;
    container.appendChild(iframe);
  }

  // ── Compartir enlace de la reunión ──
  async function shareMeetingLink() {
    if (!classroomId) return;
    const link = `${window.location.origin}/meeting/${classroomId}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast(t('classroom.linkCopied'), 'success');
    } catch (err) {
      showToast(link, 'info');
    }
  }


  // ── Init ──
  async function init() {
    classroomId = getClassroomIdFromUrl();
    if (!classroomId) {
      window.location.href = '/classrooms';
      return;
    }

    const meResult = await apiJson('/api/auth/me');
    if (!meResult) return;

    if (meResult.data.user.preferredTheme && typeof window.applyThemeFromServer === 'function') {
      window.applyThemeFromServer(meResult.data.user.preferredTheme);
    }

    await loadMeeting();
  }

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });

  startBtn?.addEventListener('click', startMeeting);

  document.getElementById('meeting-share-btn')?.addEventListener('click', () => {
    shareMeetingLink();
  });

  init();
})();


