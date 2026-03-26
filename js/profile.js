async function loadProfile() {
  const meResult = await apiJson('/api/auth/me');
  if (!meResult) return;

  const user = meResult.data.user;
  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-username').value = user.username;
  document.getElementById('profile-role').value = user.role === 'admin' ? 'Administrador' : 'Estudiante';

  // Load quiz history
  const historyResult = await apiJson('/api/classes/quiz/history');
  const container = document.getElementById('quiz-history');

  if (!historyResult || !historyResult.data.length) {
    container.innerHTML = '<p class="hint">Sin quizzes realizados aún</p>';
    return;
  }

  container.innerHTML = historyResult.data.map((q) => {
    const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
    const status = pct >= 70 ? 'passed' : 'failed';
    const date = new Date(q.completedAt).toLocaleDateString('es');
    return `
      <div class="quiz-result ${status}" style="margin-bottom:0.6rem;text-align:left;padding:0.6rem 0.8rem;">
        <strong>${q.classTitle}</strong>
        <span style="float:right;">${q.score}/${q.total} (${pct}%) — ${date}</span>
      </div>`;
  }).join('');
}

document.getElementById('profile-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const nameInput = document.getElementById('profile-name');

  if (!validateField(nameInput, { required: true, requiredMessage: 'Nombre requerido' })) return;

  const submitBtn = event.target.querySelector('button[type="submit"]');
  setButtonLoading(submitBtn, true);

  const result = await apiJson('/api/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nameInput.value.trim() }),
  });

  setButtonLoading(submitBtn, false);

  if (result?.ok) {
    showToast('Perfil actualizado', 'success');
  } else {
    showToast(result?.data?.message || 'Error al actualizar', 'error');
  }
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

loadProfile();
