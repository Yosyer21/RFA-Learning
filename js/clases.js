let currentUser = null;
let allCategories = new Set();
let currentClassesPage = 1;
let classMeta = { totalClasses: 0, totalTerms: 0, categories: [], levels: [] };

const FAVORITES_KEY = 'rfa-class-favorites';
const SPEECH_MODE_KEY = 'rfa-speech-mode';
const CLASS_FILTERS_KEY = 'rfa-class-filters';
const LEVEL_ORDER = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

function getTermCount(lesson) {
  return Array.isArray(lesson.content) ? lesson.content.length : 0;
}

function getFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

function getSpeechMode() {
  const saved = localStorage.getItem(SPEECH_MODE_KEY);
  return saved === 'es' ? 'es' : 'en';
}

function getSavedClassFilters() {
  try {
    const raw = localStorage.getItem(CLASS_FILTERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      search: typeof parsed.search === 'string' ? parsed.search : '',
      category: typeof parsed.category === 'string' ? parsed.category : '',
      level: typeof parsed.level === 'string' ? parsed.level : '',
    };
  } catch {
    return { search: '', category: '', level: '' };
  }
}

function saveClassFilters(filters) {
  localStorage.setItem(CLASS_FILTERS_KEY, JSON.stringify({
    search: String(filters.search || '').trim(),
    category: String(filters.category || '').trim(),
    level: String(filters.level || '').trim(),
  }));
}

function getCurrentClassFilters() {
  return {
    search: document.getElementById('search-input')?.value || '',
    category: document.getElementById('filter-category')?.value || '',
    level: document.getElementById('filter-level')?.value || '',
  };
}

function setSpeechMode(mode) {
  const normalized = mode === 'es' ? 'es' : 'en';
  localStorage.setItem(SPEECH_MODE_KEY, normalized);
  return normalized;
}

function syncSpeechModeSelector() {
  const selector = document.getElementById('speech-language');
  if (selector) {
    selector.value = getSpeechMode();
  }
}

function syncClassFilterInputs() {
  const saved = getSavedClassFilters();
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('filter-category');
  const levelSelect = document.getElementById('filter-level');

  if (searchInput) {
    searchInput.value = saved.search;
  }

  if (categorySelect) {
    categorySelect.value = saved.category;
  }

  if (levelSelect) {
    levelSelect.value = saved.level;
  }
}

function setFavoriteIds(ids) {
  const uniqueIds = Array.from(new Set(ids.map((id) => Number(id)).filter(Number.isFinite)));
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(uniqueIds));
  return uniqueIds;
}

function isFavoriteClass(classId) {
  return getFavoriteIds().includes(Number(classId));
}

function toggleFavoriteClass(classId) {
  const numericId = Number(classId);
  const favorites = getFavoriteIds();
  const exists = favorites.includes(numericId);
  const next = exists ? favorites.filter((id) => id !== numericId) : [...favorites, numericId];
  setFavoriteIds(next);
  return !exists;
}

function getCompletedClassIds(progress) {
  if (!progress) {
    return [];
  }

  if (Array.isArray(progress)) {
    return progress
      .flatMap((entry) => {
        if (!entry) return [];

        if (Array.isArray(entry.completedClasses)) {
          return entry.completedClasses;
        }

        if (Array.isArray(entry.completed_classes)) {
          return entry.completed_classes;
        }

        return [];
      })
      .map((id) => Number(id))
      .filter(Number.isFinite);
  }

  const completedClasses = Array.isArray(progress.completedClasses)
    ? progress.completedClasses
    : Array.isArray(progress.completed_classes)
      ? progress.completed_classes
      : [];

  return completedClasses.map((id) => Number(id)).filter(Number.isFinite);
}

function compareClasses(a, b) {
  const levelDiff = (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99);
  if (levelDiff !== 0) return levelDiff;
  if (a.id !== b.id) return a.id - b.id;
  return String(a.title || '').localeCompare(String(b.title || ''));
}

function getRecommendedClass(classes, completedIds) {
  return classes
    .filter((lesson) => !completedIds.includes(lesson.id) && getTermCount(lesson) > 0)
    .slice()
    .sort(compareClasses)[0] || null;
}

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripSpeechText(value) {
  return String(value ?? '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/[.,;:!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickVoiceForMode(mode) {
  if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== 'function') {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const normalizedMode = mode === 'es' ? 'es' : 'en';
  const langPrefix = normalizedMode === 'es' ? 'es' : 'en';
  const preferred = voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith(langPrefix));
  if (preferred) return preferred;

  const byName = voices.find((voice) => {
    const label = `${voice.name || ''} ${voice.lang || ''}`.toLowerCase();
    return normalizedMode === 'es'
      ? label.includes('spanish') || label.includes('español') || label.includes('es-')
      : label.includes('english') || label.includes('inglés') || label.includes('en-');
  });

  return byName || voices[0] || null;
}

function speakText(text, mode = 'en') {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return false;
  }

  const cleaned = stripSpeechText(text);
  if (!cleaned) return false;

  const normalizedMode = mode === 'es' ? 'es' : 'en';
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = normalizedMode === 'es' ? 'es-ES' : 'en-US';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  const voice = pickVoiceForMode(normalizedMode);
  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

function buildExamplePair(lesson, item) {
  const exampleEnglish = String(item.example ?? '').trim() || String(item.exampleEnglish ?? '').trim();
  const exampleSpanish = String(item.exampleSpanish ?? item.exampleEs ?? '').trim();

  if (exampleEnglish || exampleSpanish) {
    return {
      english: exampleEnglish || '',
      spanish: exampleSpanish || '',
    };
  }

  const englishTerm = String(item.english ?? '').trim();
  const spanishTerm = String(item.spanish ?? '').trim();
  const categoryKey = normalizeKey(lesson.category);

  const templates = {
    posiciones: {
      english: `The coach points to the "${englishTerm}" during the tactical drill.`,
      spanish: `El entrenador señala al "${spanishTerm}" durante el ejercicio táctico.`,
    },
    acciones: {
      english: `The team practices the "${englishTerm}" in every session.`,
      spanish: `El equipo practica el "${spanishTerm}" en cada sesión.`,
    },
    arbitraje: {
      english: `The referee can stop play for "${englishTerm}".`,
      spanish: `El árbitro puede detener el juego por "${spanishTerm}".`,
    },
    tactica: {
      english: `They switch to "${englishTerm}" to control the match.`,
      spanish: `Cambian a "${spanishTerm}" para controlar el partido.`,
    },
    analisis: {
      english: `The analyst tracks "${englishTerm}" to measure performance.`,
      spanish: `El analista registra "${spanishTerm}" para medir el rendimiento.`,
    },
    comunicacion: {
      english: `The commentator describes the moment as "${englishTerm}".`,
      spanish: `El comentarista describe la jugada como "${spanishTerm}".`,
    },
  };

  const fallback = {
    english: `The coach uses "${englishTerm}" in context.`,
    spanish: `El entrenador usa "${spanishTerm}" en contexto.`,
  };

  return templates[categoryKey] || fallback;
}

function renderTermList(lesson, terms, className = 'term-list') {
  return `
    <ul class="${className}">
      ${terms
        .map((item) => {
          const example = buildExamplePair(lesson, item);
          return `
            <li class="term-item">
              <div class="term-head">
                <div class="term-copy">
                  <span class="term-spanish">${escapeHtml(item.spanish)}</span>
                  <strong class="term-english">${escapeHtml(item.english)}</strong>
                </div>
                <div class="term-audio-actions">
                  <button class="term-audio-btn" type="button" data-pronounce-en="${escapeHtml(item.english)}" data-pronounce-es="${escapeHtml(item.spanish)}" aria-label="${t('classes.listen')}: ${escapeHtml(item.spanish)} / ${escapeHtml(item.english)}">
                    ${t('classes.listen')}
                  </button>
                  <button class="term-audio-btn term-audio-btn-secondary" type="button" data-pronounce-mode="es" data-pronounce-es="${escapeHtml(item.spanish)}" aria-label="${t('classes.listenSpanish')}: ${escapeHtml(item.spanish)}">
                    ${t('classes.listenSpanish')}
                  </button>
                </div>
              </div>
              <div class="term-example">
                <span class="term-example-label">${t('classes.example')}</span>
                <p class="term-example-en">${escapeHtml(example.english)}</p>
                <p class="term-example-es">${escapeHtml(example.spanish)}</p>
              </div>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function renderClassHighlights(classes, progress) {
  const container = document.getElementById('classes-highlights');
  if (!container) return;

  const completedIds = getCompletedClassIds(progress);
  const favoriteIds = getFavoriteIds();
  const favoriteCount = favoriteIds.length;
  const completedOnPage = classes.filter((lesson) => completedIds.includes(lesson.id)).length;
  const recommended = getRecommendedClass(classes, completedIds);

  container.innerHTML = `
    <div class="class-highlights-grid">
      <article class="highlight-card">
        <span class="kicker">${t('classes.recommendedLabel')}</span>
        ${
          recommended
            ? `
          <h3>${escapeHtml(translateClassTitle(recommended.title))}</h3>
          <p>${escapeHtml(translateClassCategory(recommended.category))} · ${escapeHtml(translateClassLevel(recommended.level))}</p>
          <div class="highlight-actions">
            <button class="btn btn-primary btn-small" type="button" data-open-recommended="${recommended.id}">${t('classes.recommendedAction')}</button>
            <button class="btn btn-ghost btn-small" type="button" data-preview-recommended="${recommended.id}">${t('classes.recommendedPreview')}</button>
          </div>
        `
            : `<p class="hint">${t('classes.recommendationEmpty')}</p>`
        }
      </article>

      <article class="highlight-card">
        <span class="kicker">${t('classes.favoritesTitle')}</span>
        <h3>${favoriteCount}</h3>
        <p>${t('classes.favoritesSubtitle')}</p>
        <p class="hint">${t('classes.completedOnPage', completedOnPage, classes.length)}</p>
      </article>
    </div>
  `;

  if (recommended) {
    container.querySelector('[data-open-recommended]')?.addEventListener('click', () => {
      startQuiz(recommended.id, classes);
    });

    container.querySelector('[data-preview-recommended]')?.addEventListener('click', () => {
      const card = document.querySelector(`[data-class-id="${recommended.id}"]`);
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card?.classList.add('class-card-focus');
      setTimeout(() => card?.classList.remove('class-card-focus'), 1800);
    });
  }
}

function renderClassFilters(selectedCategory, selectedLevel) {
  const catSelect = document.getElementById('filter-category');
  if (catSelect) {
    const options = [`<option value="">${escapeHtml(t('classes.allCategories'))}</option>`];
    const categories = classMeta.categories.length > 0 ? classMeta.categories : Array.from(allCategories);
    categories
      .sort((a, b) => translateClassCategory(a).localeCompare(translateClassCategory(b), getCurrentLang() === 'en' ? 'en' : 'es'))
      .forEach((cat) => {
        options.push(
          `<option value="${escapeHtml(cat)}"${cat === selectedCategory ? ' selected' : ''}>${escapeHtml(translateClassCategory(cat))}</option>`
        );
      });
    catSelect.innerHTML = options.join('');
  }

  const levelSelect = document.getElementById('filter-level');
  if (levelSelect) {
    const levels = ['', ...(classMeta.levels.length > 0 ? classMeta.levels : ['Beginner', 'Intermediate', 'Advanced'])];
    levelSelect.innerHTML = levels
      .map((level) => {
        if (!level) {
          return `<option value="">${escapeHtml(t('classes.allLevels'))}</option>`;
        }
        return `<option value="${escapeHtml(level)}"${level === selectedLevel ? ' selected' : ''}>${escapeHtml(translateClassLevel(level))}</option>`;
      })
      .join('');
  }
}

function renderClassCard(lesson) {
  const terms = Array.isArray(lesson.content) ? lesson.content : [];
  const previewTerms = terms.slice(0, 4);
  const previewCount = previewTerms.length;
  const totalTerms = terms.length;
  const hasMoreTerms = totalTerms > previewCount;
  const classTitle = translateClassTitle(lesson.title);
  const classCategory = translateClassCategory(lesson.category);
  const classLevel = translateClassLevel(lesson.level);
  const favorite = isFavoriteClass(lesson.id);
  const toggleButton = hasMoreTerms
    ? `<button class="btn btn-small btn-ghost class-toggle" type="button" data-toggle-terms="${lesson.id}" aria-expanded="false">${t('classes.showTerms')}</button>`
    : `<span class="class-card-note">${t('classes.termsLabel', totalTerms)}</span>`;

  return `
    <article class="class-card" data-class-id="${lesson.id}">
      <div class="class-card-header">
        <div>
          <h3>${escapeHtml(classTitle)}</h3>
          <p class="class-card-meta">
            <span class="badge">${escapeHtml(classCategory)}</span>
            <span class="badge">${escapeHtml(classLevel)}</span>
            <span class="badge badge-soft">${t('classes.termsLabel', totalTerms)}</span>
            <span class="badge badge-soft">${favorite ? t('classes.favorited') : t('classes.available')}</span>
          </p>
        </div>
        ${toggleButton}
      </div>

      <div class="class-preview">
        <div class="class-preview-head">
          <span class="kicker">${t('classes.previewLabel')}</span>
          <span class="class-preview-count">${t('classes.visibleStats', previewCount)}</span>
        </div>
        ${renderTermList(lesson, previewTerms, 'term-list term-list-preview')}
      </div>

      <div class="class-details hidden" data-term-panel="${lesson.id}">
        ${hasMoreTerms ? renderTermList(lesson, terms, 'term-list term-list-full') : ''}
      </div>

      <div class="class-actions">
        <button class="btn btn-small btn-ghost favorite-btn${favorite ? ' favorite-active' : ''}" type="button" data-favorite-id="${lesson.id}" aria-pressed="${favorite}">
          ${favorite ? t('classes.unfavorite') : t('classes.favorite')}
        </button>
        <button class="btn btn-small btn-primary quiz-btn" data-class-id="${lesson.id}" type="button">
          ${t('classes.takeQuiz')}
        </button>
      </div>
    </article>
  `;
}

async function loadClasses(page = 1) {
  currentClassesPage = page;
  if (!classMeta.categories.length || !classMeta.levels.length) {
    await loadClassesMeta();
  }

  const meResult = await apiJson('/api/auth/me');
  if (!meResult) return;
  currentUser = meResult.data.user;

  if (currentUser.role === 'admin') {
    document.getElementById('dashboard-link').classList.remove('hidden');
  }

  const { search, category, level } = getCurrentClassFilters();
  saveClassFilters({ search, category, level });

  const params = new URLSearchParams({ page, limit: 10 });
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (level) params.set('level', level);

  showLoading();
  const [result, progressResult] = await Promise.all([
    apiJson(`/api/classes?${params}`),
    apiJson('/api/classes/progress'),
  ]);
  hideLoading();

  if (!result) return;

  const { data: classes, pagination } = result.data;
  const progress = progressResult?.data || {};
  const container = document.getElementById('classes-container');
  const summary = document.getElementById('classes-summary');
  const pageTerms = classes.reduce((total, lesson) => total + getTermCount(lesson), 0);
  const favoriteIds = getFavoriteIds();
  const completedIds = getCompletedClassIds(progress);
  const completedOnPage = classes.filter((lesson) => completedIds.includes(lesson.id)).length;
  const availableCategories = classMeta.categories.length > 0 ? classMeta.categories.length : new Set(classes.map((lesson) => lesson.category).filter(Boolean)).size;

  summary.innerHTML = `
    <div class="classes-summary-grid">
      <div class="summary-chip">
        <span>${t('classes.availableModules')}</span>
        <strong>${classMeta.totalClasses || pagination.total}</strong>
      </div>
      <div class="summary-chip">
        <span>${t('classes.visibleTerms')}</span>
        <strong>${pageTerms}</strong>
      </div>
      <div class="summary-chip">
        <span>${t('classes.availableCategories')}</span>
        <strong>${availableCategories}</strong>
      </div>
      <div class="summary-chip">
        <span>${t('classes.catalogTerms')}</span>
        <strong>${classMeta.totalTerms || pageTerms}</strong>
      </div>
      <div class="summary-chip">
        <span>${t('classes.favoriteModules')}</span>
        <strong>${favoriteIds.length}</strong>
      </div>
      <div class="summary-chip">
        <span>${t('classes.completedOnPageLabel')}</span>
        <strong>${completedOnPage}</strong>
      </div>
    </div>
  `;

  renderClassFilters(category, level);

  container.innerHTML = classes.map(renderClassCard).join('');
  renderClassHighlights(classes, progress);
  syncSpeechModeSelector();

  container.querySelectorAll('.quiz-btn').forEach((btn) => {
    btn.addEventListener('click', () => startQuiz(parseInt(btn.dataset.classId, 10), classes));
  });

  container.querySelectorAll('.favorite-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const classId = Number(btn.dataset.favoriteId);
      const nowFavorite = toggleFavoriteClass(classId);
      showToast(nowFavorite ? t('classes.favoriteAdded') : t('classes.favoriteRemoved'), nowFavorite ? 'success' : 'info');
      loadClasses(currentClassesPage);
    });
  });

  container.querySelectorAll('.class-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const classId = btn.dataset.toggleTerms;
      const panel = container.querySelector(`[data-term-panel="${classId}"]`);
      if (!panel) return;

      const isHidden = panel.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!isHidden));
      btn.textContent = isHidden ? t('classes.showTerms') : t('classes.hideTerms');
    });
  });

  container.querySelectorAll('.term-audio-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.pronounceMode || getSpeechMode();
      const text = mode === 'es'
        ? (btn.dataset.pronounceEs || btn.dataset.pronounceEn || '')
        : (btn.dataset.pronounceEn || btn.dataset.pronounceEs || '');
      const ok = speakText(text, mode);
      if (!ok) {
        showToast(t('classes.audioNotSupported'), 'warning');
      }
    });
  });

  renderPagination('classes-pagination', pagination, loadClasses);
}

async function loadClassesMeta() {
  const result = await apiJson('/api/classes/meta');
  if (!result || !result.ok) {
    return null;
  }

  classMeta = {
    totalClasses: Number(result.data.totalClasses) || 0,
    totalTerms: Number(result.data.totalTerms) || 0,
    categories: Array.isArray(result.data.categories) ? result.data.categories : [],
    levels: Array.isArray(result.data.levels) ? result.data.levels : [],
  };

  allCategories = new Set(classMeta.categories);
  return classMeta;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function startQuiz(classId, classes, options = {}) {
  const lesson = classes.find((c) => c.id === classId);
  if (!lesson || !lesson.content?.length) {
    showToast(t('classes.noQuizContent'), 'warning');
    return;
  }

  const questionSource = Array.isArray(options.questions) && options.questions.length
    ? options.questions
    : lesson.content;

  const questions = [...questionSource].sort(() => Math.random() - 0.5).slice(0, 10);
  const classTitle = translateClassTitle(lesson.title);
  const quizTitle = options.reviewMode
    ? t('classes.reviewTitle', escapeHtml(classTitle))
    : t('classes.quizTitle', escapeHtml(classTitle));

  const overlay = document.createElement('div');
  overlay.className = 'quiz-overlay';
  overlay.innerHTML = `
    <div class="quiz-modal" role="dialog" aria-label="${quizTitle}">
      <h2>${quizTitle}</h2>
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

    const { score, total, percentage, passed, answers: graded } = result.data;
    const form = overlay.querySelector('#quiz-form');
    form.style.display = 'none';

    const failedQuestions = graded
      .filter((item) => !item.correct)
      .map((item) => ({ spanish: item.spanish, english: item.expected }))
      .filter((item) => item.spanish && item.english);

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
            ${escapeHtml(a.spanish)}: ${t('classes.yourAnswer')} "${escapeHtml(a.answer)}" ${a.correct ? '✓' : `✗ (${t('classes.correct')}: ${escapeHtml(a.expected)})`}
          </div>`
          )
          .join('')}
      </div>
      ${
        failedQuestions.length > 0
          ? `<button class="btn btn-small btn-ghost" style="margin-top:1rem;" type="button" data-retry-failed>${t('classes.retryFailed')}</button>`
          : ''
      }
      <button class="btn btn-ghost" style="margin-top:1rem;" onclick="this.closest('.quiz-overlay').remove()">${t('ui.close')}</button>
    `;

    resultsDiv.querySelector('[data-retry-failed]')?.addEventListener('click', () => {
      overlay.remove();
      startQuiz(classId, classes, { questions: failedQuestions, reviewMode: true });
    });

    showToast(passed ? t('classes.quizPassedToast') : t('classes.quizFailedToast'), passed ? 'success' : 'warning');
  });
}

let searchTimeout;
document.getElementById('search-input')?.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  saveClassFilters(getCurrentClassFilters());
  searchTimeout = setTimeout(() => loadClasses(1), 400);
});

document.getElementById('filter-category')?.addEventListener('change', () => {
  saveClassFilters(getCurrentClassFilters());
  loadClasses(1);
});
document.getElementById('filter-level')?.addEventListener('change', () => {
  saveClassFilters(getCurrentClassFilters());
  loadClasses(1);
});
document.getElementById('speech-language')?.addEventListener('change', (event) => {
  setSpeechMode(event.target.value);
  showToast(t('classes.voiceSaved'), 'success');
});

window.addEventListener('languagechange', () => {
  loadClasses(currentClassesPage);
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
});

syncClassFilterInputs();
loadClasses();
