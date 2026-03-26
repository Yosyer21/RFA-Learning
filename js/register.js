const form = document.getElementById('register-form');
const passwordInput = document.getElementById('password');

passwordInput?.addEventListener('input', () => {
  renderPasswordStrength('password-strength-container', passwordInput.value);
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const nameInput = document.getElementById('name');
  const usernameInput = document.getElementById('username');

  let valid = true;
  valid = validateField(nameInput, { required: true, requiredMessage: 'Nombre requerido' }) && valid;
  valid = validateField(usernameInput, { required: true, minLength: 3 }) && valid;
  valid = validateField(passwordInput, {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    patternMessage: 'Debe tener mayúscula, minúscula y número',
  }) && valid;

  if (!valid) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const body = {
    name: nameInput.value.trim(),
    username: usernameInput.value.trim(),
    password: passwordInput.value,
  };

  const result = await apiJson('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  setButtonLoading(submitBtn, false);

  if (!result) return;

  if (!result.ok) {
    showToast(result.data.message || 'Error al registrar', 'error');
    return;
  }

  showToast('Cuenta creada exitosamente', 'success');
  setTimeout(() => {
    window.location.href = '/home';
  }, 1000);
});
