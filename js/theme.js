(() => {
  const STORAGE_KEY = 'rfa-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function nextTheme(current) {
    return current === 'light' ? 'dark' : 'light';
  }

  function updateButtonState(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.textContent = theme === 'light' ? 'Modo oscuro' : 'Modo claro';
    });
  }

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  const theme = savedTheme === 'light' ? 'light' : 'dark';
  applyTheme(theme);

  window.addEventListener('DOMContentLoaded', () => {
    updateButtonState(theme);

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = nextTheme(currentTheme);
        applyTheme(newTheme);
        updateButtonState(newTheme);
      });
    });
  });
})();
