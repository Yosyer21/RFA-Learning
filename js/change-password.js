const form = document.getElementById('change-password-form');
const messageEl = document.getElementById('message');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  messageEl.textContent = '';

  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());

  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    messageEl.classList.add('error');
    messageEl.textContent = data.message || 'Error al actualizar contrasena';
    return;
  }

  messageEl.classList.remove('error');
  messageEl.textContent = 'Contrasena actualizada. Redirigiendo...';

  const meResponse = await fetch('/api/auth/me');
  const meData = await meResponse.json();

  if (meData.user.role === 'admin') {
    window.location.href = '/dashboard';
  } else {
    window.location.href = '/home';
  }
});
