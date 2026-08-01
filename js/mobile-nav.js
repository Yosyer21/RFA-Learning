// ═══════════════════════════════════════════════════════════
// RFA.Learning — Mobile Navigation
// Bottom nav (todas las páginas) + PWA install prompt
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Helpers ──
  function isMobile() {
    return window.matchMedia('(max-width: 780px)').matches;
  }

  function t(key) {
    return (typeof window.t === 'function' && window.t(key)) || key;
  }

  // ── Build bottom nav ──
  function buildBottomNav() {
    if (document.querySelector('.bottom-nav')) return;

    const hasLogout = !!document.querySelector('#logout-btn');
    const isAdmin = !!document.querySelector('#dashboard-link');

    // Iconos SVG minimalistas (stroke-based)
    const icons = {
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      clases: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      perfil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
      login: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
      register: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
      logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    };

    let items = [];

    if (hasLogout) {
      // Páginas autenticadas
      items = [
        { href: '/home', icon: icons.home, label: t('nav.home') || 'Home', active: location.pathname === '/home' },
        { href: '/clases', icon: icons.clases, label: t('nav.clases') || 'Clases', active: location.pathname === '/clases' },
        { href: '/profile', icon: icons.perfil, label: t('nav.perfil') || 'Perfil', active: location.pathname === '/profile' },
      ];
      if (isAdmin) {
        items.push({ href: '/dashboard', icon: icons.dashboard, label: t('nav.dashboard') || 'Dashboard', active: location.pathname === '/dashboard' });
      }
    } else {
      // Páginas no autenticadas (landing, login, register)
      items = [
        { href: '/', icon: icons.home, label: t('nav.inicio') || 'Inicio', active: location.pathname === '/' },
        { href: '/login', icon: icons.login, label: t('nav.login') || 'Iniciar sesión', active: location.pathname === '/login' },
        { href: '/register', icon: icons.register, label: t('nav.registro') || 'Registrarse', active: location.pathname === '/register' },
      ];
    }

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', t('nav.menu') || 'Navegación');

    const inner = document.createElement('div');
    inner.className = 'bottom-nav-inner';

    items.forEach((item) => {
      const a = document.createElement('a');
      a.className = 'bottom-nav-item' + (item.active ? ' active' : '');
      a.href = item.href;
      a.innerHTML = `<span class="bn-icon">${item.icon}</span><span>${item.label}</span>`;
      inner.appendChild(a);
    });

    // Botón de cerrar sesión (solo autenticado)
    if (hasLogout) {
      const logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'bottom-nav-item bottom-nav-logout';
      logout.setAttribute('aria-label', t('nav.salir') || 'Cerrar sesión');
      logout.innerHTML = `<span class="bn-icon">${icons.logout}</span><span>${t('nav.salir') || 'Salir'}</span>`;
      logout.addEventListener('click', () => {
        const original = document.getElementById('logout-btn');
        if (original) original.click();
      });
      inner.appendChild(logout);
    }

    nav.appendChild(inner);
    document.body.appendChild(nav);

    // Marcar body para padding inferior
    document.body.classList.add('has-bottom-nav');
  }

  // ── PWA install prompt ──
  function setupPwaInstall() {
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    // Botón de instalación si existe
    const installBtn = document.querySelector('#install-app-btn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          installBtn.style.display = 'none';
        }
        deferredPrompt = null;
      });
    }
  }

  // ── Service Worker (PWA) ──
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // Solo en producción (https) para evitar problemas en dev local
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silencioso: no romper la app si falla el SW
      });
    });
  }

  // ── Init ──
  function init() {
    buildBottomNav();
    setupPwaInstall();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
