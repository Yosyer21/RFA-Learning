let currentUser = null;
let allCategories = new Set();

async function loadClasses(page = 1) {
  const meResult = await apiJson('/api/auth/me');
  if (!meResult) return;
  currentUser = meResult.data.user;

  if (currentUser.role === 'admin') {
    document.getElementById('dashboard-link').classList.remove('hidden');
  }

  const search = document.getElementById('search-input')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const level = document.getElementById('filter-level')?.value || '';

  const params = new URLSearchParams({ page, limit: 10 });
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (level) params.set('level', level);

  showLoading();
  const result = await apiJson(`/api/classes?${params}`);
  hideLoading();

  if (!result) return;

  const { data: classes, pagination } = result.data;
  const container = document.getElementById('classes-container');
  const summary = document.getElementById('classes-summary');
  summary.textContent = t('classes.modulesAvailable', pagination.total);

  // Populate category filter
  classes.forEach((c) => allCategories.add(c.category));
  const catSelect = document.getElementById('filter-category');
  if (catSelect && catSelect.options.length <= 1) {
    allCategories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
  }

  container.innerHTML = classes
    .map(
      (lesson) => `
      <article class="class-card">
        <h3>${escapeHtml(lesson.title)}</h3>
        <p class="entity-meta">
          <span class="badge">${escapeHtml(lesson.category)}</span>
          <span class="badge">${escapeHtml(lesson.level)}</span>
        </p>
        <ul class="term-list">
          ${(lesson.content || [])
            .map((item) => `<li><span>${escapeHtml(item.spanish)}</span><strong>${escapeHtml(item.english)}</strong></li>`)
            .join('')}
        </ul>
        <button class="btn btn-small btn-primary quiz-btn" data-class-id="${lesson.id}" style="margin-top:0.8rem;">
          ${t('classes.takeQuiz')}
        </button>
      </article>
    `
    )
    .join('');

  // Quiz buttons
  container.querySelectorAll('.quiz-btn').forEach((btn) => {
    btn.addEventListener('click', () => startQuiz(parseInt(btn.dataset.classId), classes));
  });

  renderPagination('classes-pagination', pagination, loadClasses);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function startQuiz(classId, classes) {
  const lesson = classes.find((c) => c.id === classId);
  if (!lesson || !lesson.content?.length) {
    showToast(t('classes.noQuizContent'), 'warning');
    return;
  }

  // Shuffle and pick up to 10 questions
  const questions = [...lesson.content].sort(() => Math.random() - 0.5).slice(0, 10);

  const overlay = document.createElement('div');
  overlay.className = 'quiz-overlay';
  overlay.innerHTML = `
    <div class="quiz-modal" role="dialog" aria-label="${t('classes.quizTitle', escapeHtml(lesson.title))}">
      <h2>${t('classes.quizTitle', escapeHtml(lesson.title))}</h2>
      <p class="hint">${t('classes.quizHint')}</p>
      <form id="quiz-form">
        ${questions
          .map(
            (q, i) => `
          <div class="quiz-question">
            <label for="q${i}">${i + 1}. ${escapeHtml(q.spanish)}</label>
            <input id="q${i}" name="q${i}" placeholder="${t('classes.quizPlaceholder')}" required autocomplete="off">
          </div>`
          )
          .join('')}
        <div style="display:flex;gap:0.6rem;margin-top:1rem;">
          <button type="submit" class="btn btn-primary">${t('classes.submitAnswers')}</button>
          <button type="button" class="btn btn-ghost quiz-cancel">${t('ui.cancel')}</button>
        </div>
      </form>
      <div id="quiz-results" style="display:none;"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('.quiz-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector('#quiz-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const answers = questions.map((q, i) => ({
      spanish: q.spanish,
      answer: overlay.querySelector(`#q${i}`).value.trim(),
    }));

    const submitBtn = overlay.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    const result = await apiJson('/api/classes/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, answers }),
    });

    setButtonLoading(submitBtn, false);

    if (!result || !result.ok) {
      showToast(result?.data?.message || t('classes.quizError'), 'error');
      return;
    }

    // Show results
    const { score, total, percentage, passed, answers: graded } = result.data;
    const form = overlay.querySelector('#quiz-form');
    form.style.display = 'none';

    const resultsDiv = overlay.querySelector('#quiz-results');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
      <div class="quiz-result ${passed ? 'passed' : 'failed'}">
        <h3>${passed ? t('classes.quizPassed') : t('classes.quizFailed')}</h3>
        <p><strong>${score}/${total}</strong> (${percentage}%)</p>
        ${passed ? `<p>${t('classes.classCompleted')}</p>` : `<p>${t('classes.need70')}</p>`}
      </div>
      <div style="margin-top:1rem;">
        ${graded
          .map(
            (a) => `<div class="quiz-answer ${a.correct ? 'correct' : 'incorrect'}">
            ${escapeHtml(a.spanish)}: ${t('classes.yourAnswer')} "${escapeHtml(a.answer)}" ${a.correct ? '✓' : `✕ (${t('classes.correct')}: ${escapeHtml(a.expected)})`}
          </div>`
          )
          .join('')}
      </div>
      <button class="btn btn-ghost" style="margin-top:1rem;" onclick="this.closest('.quiz-overlay').remove()">${t('ui.close')}</button>
    `;

    showToast(passed ? t('classes.quizPassedToast') : t('classes.quizFailedToast'), passed ? 'success' : 'warning');
  });
}

// Search & filter events
let searchTimeout;
document.getElementById('search-input')?.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadClasses(1), 400);
});

document.getElementById('filter-category')?.addEventListener('change', () => loadClasses(1));
document.getElementById('filter-level')?.addEventListener('change', () => loadClasses(1));

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

loadClasses();
