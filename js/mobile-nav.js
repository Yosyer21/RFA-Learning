// ═══════════════════════════════════════════════════════════
// RFA.Learning — Mobile Navigation
// Menú hamburguesa + Bottom nav + PWA install prompt
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

  // ── Build hamburger toggle ──
  function buildNavToggle() {
    const topbar = document.querySelector('.topbar, .topbar-landing');
    if (!topbar) return null;

    // No duplicar si ya existe
    if (topbar.querySelector('.nav-toggle')) {
      return topbar.querySelector('.nav-toggle');
    }

    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', t('nav.menu') || 'Menú');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    topbar.appendChild(toggle);
    return toggle;
  }

  // ── Build mobile menu ──
  function buildMobileMenu(toggle) {
    if (document.querySelector('.mobile-menu')) return;

    const topbar = document.querySelector('.topbar, .topbar-landing');
    if (!topbar) return;

    // Clonar los enlaces del nav del topbar
    const nav = topbar.querySelector('nav');
    const links = nav ? Array.from(nav.children) : [];

    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', t('nav.menu') || 'Menú');

    const header = document.createElement('div');
    header.className = 'mobile-menu-header';

    const brand = document.createElement('div');
    brand.className = 'topbar-brand';
    brand.innerHTML = '<span class="brand-icon"></span><h1>RFA<span class="brand-dot">.</span>Learning</h1>';

    const close = document.createElement('button');
    close.className = 'mobile-menu-close';
    close.type = 'button';
    close.setAttribute('aria-label', t('ui.close') || 'Cerrar');
    close.textContent = '×';

    header.append(brand, close);
    menu.appendChild(header);

    // Añadir enlaces clonados
    links.forEach((link) => {
      const clone = link.cloneNode(true);
      clone.addEventListener('click', closeMenu);

      // Si es el botón de logout, delegar al original para que funcione
      if (link.id === 'logout-btn') {
        clone.addEventListener('click', (e) => {
          e.preventDefault();
          const original = document.getElementById('logout-btn');
          if (original) original.click();
        });
      }

      menu.appendChild(clone);
    });


    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.addEventListener('click', closeMenu);

    document.body.appendChild(overlay);
    document.body.appendChild(menu);

    // Eventos
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      overlay.classList.toggle('is-visible', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    close.addEventListener('click', closeMenu);

    function closeMenu() {
      menu.classList.remove('is-open');
      overlay.classList.remove('is-visible');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // ── Build bottom nav ──
  function buildBottomNav() {
    if (document.querySelector('.bottom-nav')) return;

    // Solo en páginas autenticadas (con logout-btn)
    const hasLogout = document.querySelector('#logout-btn');
    if (!hasLogout) return;

    const isAdmin = !!document.querySelector('#dashboard-link');

    // Iconos SVG minimalistas (stroke-based)
    const icons = {
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      clases: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      perfil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    };

    const items = [
      { href: '/home', icon: icons.home, label: t('nav.home') || 'Home', active: location.pathname === '/home' },
      { href: '/clases', icon: icons.clases, label: t('nav.clases') || 'Clases', active: location.pathname === '/clases' },
      { href: '/profile', icon: icons.perfil, label: t('nav.perfil') || 'Perfil', active: location.pathname === '/profile' },
    ];

    if (isAdmin) {
      items.push({ href: '/dashboard', icon: icons.dashboard, label: t('nav.dashboard') || 'Dashboard', active: location.pathname === '/dashboard' });
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
    const toggle = buildNavToggle();
    buildMobileMenu(toggle);
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


