const form = document.getElementById('register-form');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password-confirm');
const acceptTermsInput = document.getElementById('accept-terms');

passwordInput?.addEventListener('input', () => {
  renderPasswordStrength('password-strength-container', passwordInput.value);
  if (passwordConfirmInput?.value) {
    passwordConfirmInput.setCustomValidity(passwordConfirmInput.value === passwordInput.value ? '' : t('register.passwordMismatch'));
  }
});

passwordConfirmInput?.addEventListener('input', () => {
  if (!passwordConfirmInput.value) {
    passwordConfirmInput.setCustomValidity('');
    return;
  }

  const matches = passwordConfirmInput.value === passwordInput?.value;
  passwordConfirmInput.setCustomValidity(matches ? '' : t('register.passwordMismatch'));
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const nameInput = document.getElementById('name');
  const usernameInput = document.getElementById('username');

  let valid = true;
  valid = validateField(nameInput, { required: true, requiredMessage: t('register.nameRequired') }) && valid;
  valid = validateField(usernameInput, { required: true, minLength: 3, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMessage: t('register.emailInvalid') }) && valid;
  valid = validateField(passwordInput, {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    patternMessage: t('register.passwordPattern'),
  }) && valid;
  valid = validateField(passwordConfirmInput, {
    required: true,
    requiredMessage: t('register.passwordConfirmRequired'),
    customValidator: (value) => value === passwordInput.value,
    customMessage: t('register.passwordMismatch'),
  }) && valid;
  valid = validateField(acceptTermsInput, {
    required: true,
    requiredMessage: t('register.acceptTermsRequired'),
  }) && valid;

  if (!valid) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const body = {
    name: nameInput.value.trim(),
    username: usernameInput.value.trim().toLowerCase(),
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
    showToast(result.data.message || t('register.error'), 'error');
    return;
  }

  showToast(t('register.success'), 'success');
  setTimeout(() => {
    window.location.href = '/home';
  }, 1000);
});
