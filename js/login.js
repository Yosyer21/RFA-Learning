const form = document.getElementById('login-form');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  let valid = true;
  valid = validateField(usernameInput, { required: true, requiredMessage: t('login.usernameRequired') }) && valid;
  valid = validateField(passwordInput, { required: true, requiredMessage: t('login.passwordRequired') }) && valid;
  if (!valid) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const result = await apiJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: usernameInput.value.trim(),
      password: passwordInput.value,
    }),
  });

  setButtonLoading(submitBtn, false);

  if (!result) return;

  if (!result.ok) {
    showToast(result.data.message || t('login.authError'), 'error');
    return;
  }

  showToast(t('login.welcome'), 'success', 2000);

  if (result.data.user.mustChangePassword) {
    window.location.href = '/change-password';
    return;
  }

  if (result.data.user.role === 'admin') {
    window.location.href = '/dashboard';
    return;
  }

  window.location.href = '/home';
});
