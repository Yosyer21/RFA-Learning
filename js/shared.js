// ── Toast Notifications ──
const toastContainer = (() => {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
})();

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || ''}</span>
    <span>${message}</span>
    <button class="toast-close" aria-label="Cerrar">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
  toastContainer.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
}

function removeToast(toast) {
  toast.classList.add('toast-out');
  setTimeout(() => toast.remove(), 300);
}

// ── Loading Spinner ──
let spinnerCount = 0;

function showLoading() {
  spinnerCount++;
  if (document.querySelector('.spinner-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'spinner-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
}

function hideLoading() {
  spinnerCount = Math.max(0, spinnerCount - 1);
  if (spinnerCount === 0) {
    document.querySelector('.spinner-overlay')?.remove();
  }
}

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.classList.add('btn-loading');
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Cargando...';
  } else {
    btn.classList.remove('btn-loading');
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

// ── Password Strength ──
function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;

  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  return { score: strength, label: labels[strength] || '' };
}

function renderPasswordStrength(containerId, password) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { score, label } = getPasswordStrength(password);
  container.innerHTML = `
    <div class="password-strength" data-strength="${score}">
      <div class="password-strength-bar"></div>
      <div class="password-strength-bar"></div>
      <div class="password-strength-bar"></div>
      <div class="password-strength-bar"></div>
    </div>
    <div class="password-strength-text">${label}</div>
  `;
}

// ── Secure Fetch with toast ──
async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (response.status === 401 || response.status === 403) {
      const data = await response.json().catch(() => ({}));
      if (data.code === 'PASSWORD_UPDATE_REQUIRED') {
        window.location.href = '/change-password';
      } else if (response.status === 401) {
        window.location.href = '/login';
      }
      return null;
    }

    return response;
  } catch (err) {
    showToast('Error de conexión', 'error');
    return null;
  }
}

async function apiJson(url, options = {}) {
  const response = await apiFetch(url, options);
  if (!response) return null;

  try {
    return { ok: response.ok, status: response.status, data: await response.json() };
  } catch {
    return { ok: response.ok, status: response.status, data: { message: 'Respuesta inesperada' } };
  }
}

// ── Form Validation ──
function validateField(input, rules = {}) {
  const value = input.value.trim();
  let error = '';

  if (rules.required && !value) {
    error = rules.requiredMessage || 'Campo requerido';
  } else if (rules.minLength && value.length < rules.minLength) {
    error = `Mínimo ${rules.minLength} caracteres`;
  } else if (rules.pattern && !rules.pattern.test(value)) {
    error = rules.patternMessage || 'Formato inválido';
  }

  const errorEl = input.parentElement?.querySelector('.field-error');
  if (error) {
    input.classList.add('input-error');
    if (errorEl) errorEl.textContent = error;
  } else {
    input.classList.remove('input-error');
    if (errorEl) errorEl.textContent = '';
  }

  return !error;
}

// ── Pagination Renderer ──
function renderPagination(containerId, pagination, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container || !pagination || pagination.pages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  const { page, pages, total } = pagination;
  let html = '<div class="pagination">';
  html += `<button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">&laquo;</button>`;

  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);

  for (let i = start; i <= end; i++) {
    html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += `<button ${page >= pages ? 'disabled' : ''} data-page="${page + 1}">&raquo;</button>`;
  html += `<span class="pagination-info">${total} total</span>`;
  html += '</div>';

  container.innerHTML = html;
  container.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page);
      if (p >= 1 && p <= pages) onPageChange(p);
    });
  });
}
