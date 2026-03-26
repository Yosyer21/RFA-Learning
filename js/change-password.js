const form = document.getElementById('change-password-form');
const newPasswordInput = document.getElementById('newPassword');

newPasswordInput?.addEventListener('input', () => {
  renderPasswordStrength('password-strength-container', newPasswordInput.value);
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const currentInput = document.getElementById('currentPassword');
  let valid = true;
  valid = validateField(currentInput, { required: true, requiredMessage: 'Contraseña actual requerida' }) && valid;
  valid = validateField(newPasswordInput, {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    patternMessage: 'Debe tener mayúscula, minúscula y número',
  }) && valid;
  if (!valid) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const result = await apiJson('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPassword: currentInput.value,
      newPassword: newPasswordInput.value,
    }),
  });

  setButtonLoading(submitBtn, false);

  if (!result) return;

  if (!result.ok) {
    showToast(result.data.message || 'Error al actualizar contraseña', 'error');
    return;
  }

  showToast('Contraseña actualizada. Redirigiendo...', 'success');

  const meResult = await apiJson('/api/auth/me');
  setTimeout(() => {
    if (meResult?.data?.user?.role === 'admin') {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/home';
    }
  }, 1500);
});
