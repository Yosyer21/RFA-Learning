const form = document.getElementById('login-form');
const errorEl = document.getElementById('error');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.textContent = '';

  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    errorEl.textContent = data.message || 'Error de autenticacion';
    return;
  }

  if (data.user.mustChangePassword) {
    window.location.href = '/change-password';
    return;
  }

  if (data.user.role === 'admin') {
    window.location.href = '/dashboard';
    return;
  }

  window.location.href = '/home';
});
