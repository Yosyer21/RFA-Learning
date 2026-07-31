(() => {
  const STORAGE_KEY = 'rfa-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Persist theme preference to the server (if logged in)
  function persistTheme(theme) {
    const preferredTheme = theme === 'light' ? 'light' : 'dark';
    try {
      fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredTheme }),
      }).catch(() => {});
    } catch (e) { /* ignore */ }
  }

  function nextTheme(current) {
    return current === 'light' ? 'dark' : 'light';
  }

  function updateButtonState(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.textContent = theme === 'light'
        ? (typeof t === 'function' ? t('theme.dark') : 'Modo oscuro')
        : (typeof t === 'function' ? t('theme.light') : 'Modo claro');
    });
  }

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const theme = savedTheme === 'light' ? 'light' : 'dark';
  applyTheme(theme);

  // Expose a helper so pages can apply the server theme and sync the toggle button
  window.applyThemeFromServer = function (preferredTheme) {
    const t = preferredTheme === 'light' ? 'light' : 'dark';
    applyTheme(t);
    updateButtonState(t);
  };

  window.addEventListener('DOMContentLoaded', () => {
    updateButtonState(theme);

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = nextTheme(currentTheme);
        applyTheme(newTheme);
        updateButtonState(newTheme);
        persistTheme(newTheme);
      });
    });
  });
})();
