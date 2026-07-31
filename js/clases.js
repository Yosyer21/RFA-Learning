let currentUser = null;
let allCategories = new Set();
let currentClassesPage = 1;
let classMeta = { totalClasses: 0, totalTerms: 0, categories: [], levels: [] };
let allClassesCache = [];
let currentLevelFilter = '';

const FAVORITES_KEY = 'rfa-class-favorites';
const SPEECH_MODE_KEY = 'rfa-speech-mode';
const CLASS_FILTERS_KEY = 'rfa-class-filters';
const LEVEL_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };

// ── Category → image mapping ──
const CATEGORY_IMAGES = {
  Posiciones: '../assets/2.jpeg',
  Acciones: '../assets/5.jpeg',
  Arbitraje: '../assets/7.jpeg',
  Táctica: '../assets/9.jpeg',
  Análisis: '../assets/11.jpeg',
  Comunicación: '../assets/13.jpeg',
  Historia: '../assets/3.jpeg',
  Reglas: '../assets/7.jpeg',
  Leyendas: '../assets/4.jpeg',
  Competiciones: '../assets/6.jpeg',
  Equipamiento: '../assets/8.jpeg',
  Cultura: '../assets/10.jpeg',
};

const CATEGORY_ICONS = {
  Posiciones: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  Acciones: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  Arbitraje: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  Táctica: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  Análisis: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  Comunicación: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  Historia: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  Reglas: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  Leyendas: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  Competiciones: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 22V2h4v20"/></svg>',
  Equipamiento: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  Cultura: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
};

const CATEGORY_DESCRIPTIONS = {
  Posiciones: 'Aprende los nombres de cada rol en el campo',
  Acciones: 'Domina los verbos y acciones del juego',
  Arbitraje: 'Conoce las reglas y decisiones arbitrales',
  Táctica: 'Entiende formaciones y estrategias',
  Análisis: 'Métricas y conceptos de scouting',
  Comunicación: 'Frases clave del comentarista deportivo',
  Historia: 'Descubre los orígenes y evolución del fútbol',
  Reglas: 'Domina las reglas detalladas del juego',
  Leyendas: 'Conoce a los jugadores más icónicos de la historia',
  Competiciones: 'Explora los torneos más importantes del mundo',
  Equipamiento: 'Identifica el equipo y vestimenta deportiva',
  Cultura: 'Sumérgete en la pasión y cultura futbolera',
};

function getTermCount(lesson) {
  return Array.isArray(lesson.content) ? lesson.content.length : 0;
}

function getFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter(Number.isFinite) : [];
  } catch { return []; }
}

function getSpeechMode() {
  const saved = localStorage.getItem(SPEECH_MODE_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  // Fallback: read voice preference saved from profile (rfa-voice: 'english'/'spanish')
  const profileVoice = localStorage.getItem('rfa-voice');
  if (profileVoice === 'spanish') return 'es';
  return 'en';
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
  } catch { return { search: '', category: '', level: '' }; }
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
    level: currentLevelFilter,
  };
}

function setSpeechMode(mode) {
  const normalized = mode === 'es' ? 'es' : 'en';
  localStorage.setItem(SPEECH_MODE_KEY, normalized);
  return normalized;
}

function syncSpeechModeSelector() {
  const selector = document.getElementById('speech-language');
  if (selector) selector.value = getSpeechMode();
}

function syncClassFilterInputs() {
  const saved = getSavedClassFilters();
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('filter-category');
  if (searchInput) searchInput.value = saved.search;
  if (categorySelect) categorySelect.value = saved.category;
  currentLevelFilter = saved.level || '';
  // Sync level tab
  document.querySelectorAll('.level-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.level === currentLevelFilter);
  });
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
  if (!progress) return [];
  if (Array.isArray(progress)) {
    return progress.flatMap((entry) => {
      if (!entry) return [];
      if (Array.isArray(entry.completedClasses)) return entry.completedClasses;
      if (Array.isArray(entry.completed_classes)) return entry.completed_classes;
      return [];
    }).map((id) => Number(id)).filter(Number.isFinite);
  }
  const completedClasses = Array.isArray(progress.completedClasses)
    ? progress.completedClasses
    : Array.isArray(progress.completed_classes) ? progress.completed_classes : [];
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
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripSpeechText(value) {
  return String(value ?? '').replace(/\([^)]*\)/g, ' ').replace(/\s*\/\s*/g, ' ').replace(/[.,;:!?]+/g, ' ').replace(/\s+/g, ' ').trim();
}

let speechVoicesReady = false;
const speechVoiceQueue = [];

function ensureVoicesLoaded() {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== 'function') {
      resolve(false);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speechVoicesReady = true;
      resolve(true);
      return;
    }
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      speechVoicesReady = true;
      resolve(true);
    }, { once: true });
    // Fallback: some browsers fire voiceschanged synchronously
    setTimeout(() => {
      if (!speechVoicesReady) {
        const retry = window.speechSynthesis.getVoices();
        if (retry.length > 0) {
          speechVoicesReady = true;
          resolve(true);
        } else {
          resolve(false);
        }
      }
    }, 500);
  });
}

function pickVoiceForMode(mode) {
  if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== 'function') return null;
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

async function speakText(text, mode = 'en') {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return false;
  const cleaned = stripSpeechText(text);
  if (!cleaned) return false;
  const normalizedMode = mode === 'es' ? 'es' : 'en';
  // Ensure voices are loaded before speaking
  await ensureVoicesLoaded();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = normalizedMode === 'es' ? 'es-ES' : 'en-US';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  const voice = pickVoiceForMode(normalizedMode);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  return true;
}

function buildExamplePair(lesson, item) {
  const exampleEnglish = String(item.example ?? '').trim() || String(item.exampleEnglish ?? '').trim();
  const exampleSpanish = String(item.exampleSpanish ?? item.exampleEs ?? '').trim();
  if (exampleEnglish || exampleSpanish) {
    return { english: exampleEnglish || '', spanish: exampleSpanish || '' };
  }
  const englishTerm = String(item.english ?? '').trim();
  const spanishTerm = String(item.spanish ?? '').trim();
  const categoryKey = normalizeKey(lesson.category);
  const templates = {
    posiciones: { english: `The coach points to the "${englishTerm}" during the tactical drill.`, spanish: `El entrenador señala al "${spanishTerm}" durante el ejercicio táctico.` },
    acciones: { english: `The team practices the "${englishTerm}" in every session.`, spanish: `El equipo practica el "${spanishTerm}" en cada sesión.` },
    arbitraje: { english: `The referee can stop play for "${englishTerm}".`, spanish: `El árbitro puede detener el juego por "${spanishTerm}".` },
    tactica: { english: `They switch to "${englishTerm}" to control the match.`, spanish: `Cambian a "${spanishTerm}" para controlar el partido.` },
    analisis: { english: `The analyst tracks "${englishTerm}" to measure performance.`, spanish: `El analista registra "${spanishTerm}" para medir el rendimiento.` },
    comunicacion: { english: `The commentator describes the moment as "${englishTerm}".`, spanish: `El comentarista describe la jugada como "${spanishTerm}".` },
  };
  const fallback = { english: `The coach uses "${englishTerm}" in context.`, spanish: `El entrenador usa "${spanishTerm}" en contexto.` };
  return templates[categoryKey] || fallback;
}

function renderTermList(lesson, terms, className = 'term-list') {
  return `
    <ul class="${className}">
      ${terms.map((item) => {
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
          </li>`;
      }).join('')}
    </ul>`;
}

function renderClassHighlights(classes, progress) {
  const container = document.getElementById('classes-highlights');
  if (!container) return;

  const completedIds = getCompletedClassIds(progress);
  const favoriteIds = getFavoriteIds();
  const favoriteCount = favoriteIds.length;
  const recommended = getRecommendedClass(classes, completedIds);

  container.innerHTML = `
    <div class="highlights-modern-grid">
      <article class="highlight-card-modern">
        <span class="kicker">${t('classes.recommendedLabel')}</span>
        ${recommended
          ? `
          <h3>${escapeHtml(translateClassTitle(recommended.title))}</h3>
          <p>${escapeHtml(translateClassCategory(recommended.category))} · ${escapeHtml(translateClassLevel(recommended.level))}</p>
          <div class="highlight-actions">
            <button class="btn-modern btn-modern-primary" type="button" data-open-recommended="${recommended.id}">${t('classes.recommendedAction')}</button>
            <button class="btn-modern btn-modern-ghost" type="button" data-preview-recommended="${recommended.id}">${t('classes.recommendedPreview')}</button>
          </div>`
          : `<p class="hint">${t('classes.recommendationEmpty')}</p>`
        }
      </article>

      <article class="highlight-card-modern">
        <span class="kicker">${t('classes.favoritesTitle')}</span>
        <div class="highlight-fav-number">${favoriteCount}</div>
        <p>${t('classes.favoritesSubtitle')}</p>
      </article>
    </div>`;

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

function renderClassFilters(selectedCategory) {
  const catSelect = document.getElementById('filter-category');
  if (catSelect) {
    const options = [`<option value="">${escapeHtml(t('classes.allCategories'))}</option>`];
    const categories = classMeta.categories.length > 0 ? classMeta.categories : Array.from(allCategories);
    categories.sort((a, b) => translateClassCategory(a).localeCompare(translateClassCategory(b), getCurrentLang() === 'en' ? 'en' : 'es'))
      .forEach((cat) => {
        options.push(`<option value="${escapeHtml(cat)}"${cat === selectedCategory ? ' selected' : ''}>${CATEGORY_ICONS[cat] || ''} ${escapeHtml(translateClassCategory(cat))}</option>`);
      });
    catSelect.innerHTML = options.join('');
  }
}

function getClassImage(lesson) {
  return CATEGORY_IMAGES[lesson.category] || '../assets/1.jpeg';
}

function getClassDescription(lesson) {
  return CATEGORY_DESCRIPTIONS[lesson.category] || `${getTermCount(lesson)} términos para dominar`;
}

function renderClassCard(lesson, masteryData) {
  const classTitle = translateClassTitle(lesson.title);
  const classCategory = translateClassCategory(lesson.category);
  const classLevel = translateClassLevel(lesson.level);
  const favorite = isFavoriteClass(lesson.id);
  const totalTerms = getTermCount(lesson);
  const imgSrc = getClassImage(lesson);
  const desc = getClassDescription(lesson);
  const categoryIcon = CATEGORY_ICONS[lesson.category] || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';

  const starSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const starOutlineSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

  // Mastery progress bar
  let masteryHtml = '';
  if (masteryData && masteryData[lesson.id] !== undefined) {
    const pct = Math.min(100, Math.max(0, masteryData[lesson.id]));
    const statusClass = pct >= 100 ? 'mastered' : (pct > 0 ? 'in-progress' : '');
    const statusText = pct >= 100 ? t('classes.progressMastered') : (pct > 0 ? t('classes.progressInProgress') : t('classes.progressNotStarted'));
    masteryHtml = `
      <div class="class-mastery-bar">
        <div class="class-mastery-track">
          <div class="class-mastery-fill" style="width:${pct}%"></div>
        </div>
        <div class="class-mastery-label">
          <span>${t('classes.progressLabel')}</span>
          <span class="mastery-status ${statusClass}">${statusText} · ${pct}%</span>
        </div>
      </div>`;
  }

  return `
    <article class="class-card-modern" data-class-id="${lesson.id}">
      <div class="class-card-image">
        <img src="${imgSrc}" alt="" loading="lazy">
        <span class="class-badge">${escapeHtml(classLevel)}</span>
        ${favorite ? `<span class="class-fav-badge">${starSvg}</span>` : ''}
        <span class="class-level-badge">${categoryIcon} ${escapeHtml(classCategory)}</span>
      </div>
      <div class="class-card-body">
        <h3>${escapeHtml(classTitle)}</h3>
        <span class="class-card-category">${categoryIcon} ${escapeHtml(classCategory)}</span>
        <p class="class-card-desc">${escapeHtml(desc)}</p>
        ${masteryHtml}
      </div>
      <div class="class-card-footer">
        <span class="class-terms-count">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          ${totalTerms} ${t('classes.termsLabel', totalTerms)}
        </span>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn-modern btn-modern-ghost favorite-btn${favorite ? ' favorite-active' : ''}" type="button" data-favorite-id="${lesson.id}" aria-pressed="${favorite}" title="${favorite ? t('classes.unfavorite') : t('classes.favorite')}">
            ${favorite ? starSvg : starOutlineSvg}
          </button>
          <button class="btn-modern btn-modern-primary quiz-btn" data-class-id="${lesson.id}" type="button">
            ${t('classes.takeQuiz')}
          </button>
        </div>
      </div>
      <div class="practice-mode-bar">
        <span class="practice-mode-label">${t('classes.modeLabel')}</span>
        <div class="practice-mode-buttons">
          <button class="practice-mode-btn" type="button" data-study-mode="${lesson.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            ${t('classes.studyMode')}
          </button>
          <button class="practice-mode-btn" type="button" data-flashcards-mode="${lesson.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            ${t('classes.flashcardsMode')}
          </button>
          <button class="practice-mode-btn" type="button" data-writing-mode="${lesson.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            ${t('classes.writingMode')}
          </button>
          <button class="practice-mode-btn" type="button" data-quiz-mode="${lesson.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${t('classes.quizMode')}
          </button>
        </div>
      </div>
    </article>`;
}

function renderPaginationModern(containerId, pagination, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!pagination || pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const { page, totalPages } = pagination;
  let html = '';

  const chevronLeft = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  const chevronRight = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

  html += `<button class="page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>${chevronLeft}</button>`;

  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  if (startPage > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="pagination-info">…</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn${i === page ? ' active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="pagination-info">…</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `<button class="page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>${chevronRight}</button>`;

  container.innerHTML = html;

  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p >= 1 && p <= totalPages) callback(p);
    });
  });
}

async function loadClasses(page = 1) {
  currentClassesPage = page;
  if (!classMeta.categories.length || !classMeta.levels.length) {
    await loadClassesMeta();
  }

  const meResult = await apiJson('/api/auth/me');
  if (!meResult) return;
  currentUser = meResult.data.user;

  // Sync speech mode with profile voice preference (preferredVoice: 'english'/'spanish')
  if (currentUser.preferredVoice) {
    const profileMode = currentUser.preferredVoice === 'spanish' ? 'es' : 'en';
    if (!localStorage.getItem(SPEECH_MODE_KEY)) {
      localStorage.setItem(SPEECH_MODE_KEY, profileMode);
    }
    localStorage.setItem('rfa-voice', currentUser.preferredVoice);
  }

  // Apply theme from server preference (overrides localStorage default)
  if (currentUser.preferredTheme && typeof window.applyThemeFromServer === 'function') {
    window.applyThemeFromServer(currentUser.preferredTheme);
  }

  if (currentUser.role === 'admin') {
    document.getElementById('dashboard-link').classList.remove('hidden');
  }

  const { search, category } = getCurrentClassFilters();
  saveClassFilters({ search, category, level: currentLevelFilter });

  const params = new URLSearchParams({ page, limit: 10 });
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (currentLevelFilter) params.set('level', currentLevelFilter);

  showLoading();
  const [result, progressResult, quizHistoryResult] = await Promise.all([
    apiJson(`/api/classes?${params}`),
    apiJson('/api/classes/progress'),
    apiJson('/api/classes/quiz/history'),
  ]);
  hideLoading();

  if (!result) return;

  const { data: classes, pagination } = result.data;
  const progress = progressResult?.data || {};
  const quizHistory = Array.isArray(quizHistoryResult?.data) ? quizHistoryResult.data : [];
  const container = document.getElementById('classes-container');
  const completedIds = getCompletedClassIds(progress);
  const favoriteIds = getFavoriteIds();

  // Update hero stats
  document.getElementById('hero-total-classes').textContent = classMeta.totalClasses || pagination.total;
  document.getElementById('hero-completed').textContent = completedIds.length;
  document.getElementById('hero-favorites').textContent = favoriteIds.length;

  renderClassFilters(category);
  // Compute mastery data from progress + quiz history
  const masteryData = computeMasteryData(progress, classes, quizHistory);
  container.innerHTML = classes.map((lesson) => renderClassCard(lesson, masteryData)).join('');
  renderClassHighlights(classes, progress);
  renderReviewSuggestions(classes, quizHistory);
  syncSpeechModeSelector();

  // Quiz buttons
  container.querySelectorAll('.quiz-btn').forEach((btn) => {
    btn.addEventListener('click', () => startQuiz(parseInt(btn.dataset.classId, 10), classes));
  });

  // Favorite buttons
  container.querySelectorAll('.favorite-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const classId = Number(btn.dataset.favoriteId);
      const nowFavorite = toggleFavoriteClass(classId);
      showToast(nowFavorite ? t('classes.favoriteAdded') : t('classes.favoriteRemoved'), nowFavorite ? 'success' : 'info');
      loadClasses(currentClassesPage);
    });
  });

  // Practice mode buttons
  container.querySelectorAll('[data-study-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const classId = Number(btn.dataset.studyMode);
      const lesson = classes.find((c) => c.id === classId);
      if (lesson) showStudyView(lesson, classes);
    });
  });

  container.querySelectorAll('[data-flashcards-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const classId = Number(btn.dataset.flashcardsMode);
      const lesson = classes.find((c) => c.id === classId);
      if (lesson) openFlashcards(lesson);
    });
  });

  container.querySelectorAll('[data-writing-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const classId = Number(btn.dataset.writingMode);
      const lesson = classes.find((c) => c.id === classId);
      if (lesson) openWritingPractice(lesson);
    });
  });

  container.querySelectorAll('[data-quiz-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const classId = Number(btn.dataset.quizMode);
      startQuiz(classId, classes);
    });
  });

  renderPaginationModern('classes-pagination', pagination, loadClasses);
}

async function loadClassesMeta() {
  const result = await apiJson('/api/classes/meta');
  if (!result || !result.ok) return null;
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

function showStudyView(lesson, classes) {
  const classTitle = translateClassTitle(lesson.title);
  const classCategory = translateClassCategory(lesson.category);
  const classLevel = translateClassLevel(lesson.level);
  const currentLang = getCurrentLang();
  const terms = lesson.content || [];

  const overlay = document.createElement('div');
  overlay.className = 'quiz-overlay';
  overlay.innerHTML = `
    <div class="study-modal" role="dialog" aria-label="${escapeHtml(classTitle)}">
      <div class="study-modal-header">
        <div>
          <span class="kicker">${escapeHtml(classCategory)} · ${escapeHtml(classLevel)}</span>
          <h2>${escapeHtml(classTitle)}</h2>
          <p class="study-terms-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            ${terms.length} ${t('classes.termsLabel', terms.length)}
          </p>
        </div>
        <button class="btn-modern btn-modern-ghost study-close" type="button" aria-label="${t('ui.close')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="study-intro">
        <p>${currentLang === 'en'
          ? `Review the <strong>${terms.length}</strong> terms below before taking the quiz. Study the Spanish term and its English translation, then click "Start Quiz" when you're ready.`
          : `Revisa los <strong>${terms.length}</strong> términos a continuación antes de hacer el quiz. Estudia el término en español y su traducción al inglés, luego haz clic en "Comenzar Quiz" cuando estés listo.`}
        </p>
      </div>

      <div class="study-terms-list">
        ${terms.map((item, i) => {
          const example = buildExamplePair(lesson, item);
          const hasDefinition = item.definition || item.definitionEn;
          const defText = currentLang === 'en' ? item.definitionEn : item.definition;
          return `
            <div class="study-term-card">
              <div class="study-term-number">${i + 1}</div>
              <div class="study-term-content">
                <div class="study-term-pair">
                  <span class="study-term-es">${escapeHtml(item.spanish)}</span>
                  <span class="study-term-arrow">→</span>
                  <span class="study-term-en">${escapeHtml(item.english)}</span>
                </div>
                ${hasDefinition ? `
                <div class="study-term-definition">
                  <span class="study-definition-label">${t('classes.definition')}</span>
                  <p class="study-definition-text">${escapeHtml(defText)}</p>
                </div>` : ''}
                <div class="study-term-example">
                  <span class="study-example-label">${t('classes.example')}</span>
                  <p class="study-example-text">${currentLang === 'en' ? escapeHtml(example.english) : escapeHtml(example.spanish)}</p>
                </div>
                <div class="study-term-audio">
                  <button class="term-audio-btn" type="button" data-pronounce-en="${escapeHtml(item.english)}" data-pronounce-es="${escapeHtml(item.spanish)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    ${t('classes.listen')}
                  </button>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>

      <div class="study-modal-footer">
        <button class="btn-modern btn-modern-ghost study-close" type="button">${t('ui.cancel')}</button>
        <button class="btn-modern btn-modern-primary study-start-quiz" type="button" data-class-id="${lesson.id}">${t('classes.startQuiz')}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Close handlers
  overlay.querySelectorAll('.study-close').forEach(btn => {
    btn.addEventListener('click', () => overlay.remove());
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // Audio buttons
  overlay.querySelectorAll('[data-pronounce-en]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = getSpeechMode();
      const text = mode === 'es' ? btn.dataset.pronounceEs : btn.dataset.pronounceEn;
      speakText(text, mode);
    });
  });

  // Start quiz - pass reviewMode=true to skip study view loop
  overlay.querySelector('.study-start-quiz')?.addEventListener('click', () => {
    overlay.remove();
    startQuiz(lesson.id, classes, { reviewMode: true });
  });
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMcqOptions(correctTerm, allTerms, count = 4) {
  // Get unique English terms from all terms in the lesson
  const allEnglish = allTerms
    .map((t) => String(t.english || '').trim())
    .filter((e) => e && e !== correctTerm);
  const uniqueDistractors = [...new Set(allEnglish)];
  const shuffled = shuffleArray(uniqueDistractors);
  const distractors = shuffled.slice(0, count - 1);
  const options = shuffleArray([correctTerm, ...distractors]);
  return options;
}

function startQuiz(classId, classes, options = {}) {
  const lesson = classes.find((c) => c.id === classId);
  if (!lesson || !lesson.content?.length) {
    showToast(t('classes.noQuizContent'), 'warning');
    return;
  }

  // If not in review mode and no explicit questions passed, show study view first
  if (!options.reviewMode && !options.questions) {
    showStudyView(lesson, classes);
    return;
  }

  const questionSource = Array.isArray(options.questions) && options.questions.length ? options.questions : lesson.content;
  const questions = shuffleArray(questionSource).slice(0, 10);
  const classTitle = translateClassTitle(lesson.title);
  const quizTitle = options.reviewMode
    ? t('classes.reviewTitle', escapeHtml(classTitle))
    : t('classes.quizTitle', escapeHtml(classTitle));
  const currentLang = getCurrentLang();

  // Pre-generate MCQ options for each question
  const mcqQuestions = questions.map((q) => {
    const correctEnglish = String(q.english || '').trim();
    const options = generateMcqOptions(correctEnglish, lesson.content, 4);
    return { term: q, correctEnglish, options };
  });

  const overlay = document.createElement('div');
  overlay.className = 'quiz-overlay';
  overlay.innerHTML = `
    <div class="quiz-modal quiz-modal-mcq" role="dialog" aria-label="${quizTitle}">
      <div class="quiz-mcq-header">
        <h2>${quizTitle}</h2>
        <p class="hint">${t('classes.mcqHint')}</p>
        <div class="mcq-progress-bar">
          <div class="mcq-progress-fill" id="mcq-progress-fill" style="width:0%"></div>
        </div>
      </div>
      <div id="mcq-questions-container">
        ${mcqQuestions.map((mq, i) => {
          const q = mq.term;
          const definition = currentLang === 'en'
            ? String(q.definitionEn || q.definition || '').trim()
            : String(q.definition || q.definitionEn || '').trim();
          return `
            <div class="mcq-question" data-qindex="${i}" ${i > 0 ? 'style="display:none"' : ''}>
              <div class="mcq-question-header">
                <span class="mcq-question-number">${t('classes.mcqTerm')} ${i + 1}/${mcqQuestions.length}</span>
              </div>
              <div class="mcq-term-display">
                <span class="mcq-term-text">${escapeHtml(q.spanish)}</span>
              </div>
              ${definition ? `<div class="mcq-definition">
                <span class="mcq-def-label">${t('classes.mcqDefinition')}:</span>
                <p class="mcq-def-text">${escapeHtml(definition)}</p>
              </div>` : ''}
              <div class="mcq-options">
                ${mq.options.map((opt, oi) => {
                  const letter = String.fromCharCode(65 + oi); // A, B, C, D
                  return `
                    <label class="mcq-option" data-option-value="${escapeHtml(opt)}">
                      <input type="radio" name="mcq-${i}" value="${escapeHtml(opt)}" class="mcq-radio">
                      <span class="mcq-option-letter">${letter}</span>
                      <span class="mcq-option-text">${escapeHtml(opt)}</span>
                    </label>`;
                }).join('')}
              </div>
              <div class="mcq-nav">
                <button type="button" class="btn-modern btn-modern-ghost mcq-prev" ${i === 0 ? 'disabled' : ''}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  ${currentLang === 'en' ? 'Previous' : 'Anterior'}
                </button>
                ${i < mcqQuestions.length - 1
                  ? `<button type="button" class="btn-modern btn-modern-primary mcq-next">${currentLang === 'en' ? 'Next' : 'Siguiente'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>`
                  : `<button type="button" class="btn-modern btn-modern-primary mcq-submit-all">${t('classes.submitAnswers')}</button>`
                }
              </div>
            </div>`;
        }).join('')}
      </div>
      <div id="mcq-results" style="display:none;"></div>
    </div>`;

  document.body.appendChild(overlay);

  // ── Navigation between questions ──
  let currentQuestionIndex = 0;
  const totalQuestions = mcqQuestions.length;

  function showQuestion(index) {
    overlay.querySelectorAll('.mcq-question').forEach((el) => {
      el.style.display = 'none';
    });
    const qEl = overlay.querySelector(`.mcq-question[data-qindex="${index}"]`);
    if (qEl) qEl.style.display = 'block';
    currentQuestionIndex = index;
    // Update progress bar
    const progress = ((index + 1) / totalQuestions) * 100;
    const progressFill = overlay.querySelector('#mcq-progress-fill');
    if (progressFill) progressFill.style.width = `${progress}%`;
  }

  overlay.querySelectorAll('.mcq-next').forEach((btn) => {
    btn.addEventListener('click', () => {
      const currentQ = overlay.querySelector(`.mcq-question[data-qindex="${currentQuestionIndex}"]`);
      const selected = currentQ?.querySelector('input[type="radio"]:checked');
      if (!selected) {
        showToast(t('classes.mcqSelect'), 'warning');
        return;
      }
      if (currentQuestionIndex < totalQuestions - 1) {
        showQuestion(currentQuestionIndex + 1);
      }
    });
  });

  overlay.querySelectorAll('.mcq-prev').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
      }
    });
  });

  // ── Submit all answers ──
  overlay.querySelector('.mcq-submit-all')?.addEventListener('click', async () => {
    // Check all questions have an answer
    const allAnswered = mcqQuestions.every((mq, i) => {
      const qEl = overlay.querySelector(`.mcq-question[data-qindex="${i}"]`);
      return qEl?.querySelector('input[type="radio"]:checked');
    });
    if (!allAnswered) {
      showToast(t('classes.mcqSelect'), 'warning');
      return;
    }

    const answers = mcqQuestions.map((mq, i) => {
      const qEl = overlay.querySelector(`.mcq-question[data-qindex="${i}"]`);
      const selected = qEl?.querySelector('input[type="radio"]:checked')?.value || '';
      return {
        spanish: mq.term.spanish,
        selected,
        options: mq.options,
      };
    });

    const submitBtn = overlay.querySelector('.mcq-submit-all');
    setButtonLoading(submitBtn, true);

    const result = await apiJson('/api/classes/quiz/multiple-choice', {
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
    const questionsContainer = overlay.querySelector('#mcq-questions-container');
    questionsContainer.style.display = 'none';

    const failedQuestions = graded.filter((item) => !item.correct).map((item) => ({
      spanish: item.spanish,
      english: item.expected,
    })).filter((item) => item.spanish && item.english);

    const resultsDiv = overlay.querySelector('#mcq-results');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
      <div class="quiz-result ${passed ? 'passed' : 'failed'}">
        <h3>${passed ? t('classes.quizPassed') : t('classes.quizFailed')}</h3>
        <p><strong>${score}/${total}</strong> (${percentage}%)</p>
        ${passed ? `<p>${t('classes.classCompleted')}</p>` : `<p>${t('classes.need70')}</p>`}
      </div>
      <div class="mcq-results-list">
        ${graded.map((a, i) => {
          const checkSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
          const crossSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
          const q = mcqQuestions[i]?.term;
          const definition = currentLang === 'en'
            ? String(q?.definitionEn || q?.definition || '').trim()
            : String(q?.definition || q?.definitionEn || '').trim();
          return `
            <div class="mcq-result-item ${a.correct ? 'correct' : 'incorrect'}">
              <div class="mcq-result-header">
                <span class="mcq-result-icon">${a.correct ? checkSvg : crossSvg}</span>
                <span class="mcq-result-term">${escapeHtml(a.spanish)}</span>
              </div>
              <div class="mcq-result-details">
                <p><strong>${t('classes.mcqYourAnswer')}:</strong> ${escapeHtml(a.selected)}</p>
                ${!a.correct ? `<p><strong>${t('classes.mcqExpected')}:</strong> ${escapeHtml(a.expected)}</p>` : ''}
                ${definition ? `<p class="mcq-result-def"><strong>${t('classes.mcqDefinition')}:</strong> ${escapeHtml(definition)}</p>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
      ${failedQuestions.length > 0
        ? `<button class="btn-modern btn-modern-ghost" style="margin-top:1rem;" type="button" data-retry-failed-mcq>${t('classes.retryFailed')}</button>`
        : ''}
      <button class="btn-modern btn-modern-ghost" style="margin-top:1rem;" onclick="this.closest('.quiz-overlay').remove()">${t('ui.close')}</button>`;

    resultsDiv.querySelector('[data-retry-failed-mcq]')?.addEventListener('click', () => {
      overlay.remove();
      startQuiz(classId, classes, { questions: failedQuestions, reviewMode: true });
    });

    showToast(passed ? t('classes.quizPassedToast') : t('classes.quizFailedToast'), passed ? 'success' : 'warning');
  });

  // ── Close handlers ──
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  // Keyboard navigation
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });
}

// ── Mastery Data Computation ──
function computeMasteryData(progress, classes, quizHistory) {
  const mastery = {};
  if (!progress) return mastery;

  // Extract quiz history / attempts per class
  const attempts = Array.isArray(quizHistory) && quizHistory.length
    ? quizHistory
    : Array.isArray(progress.quizHistory) ? progress.quizHistory
    : Array.isArray(progress.attempts) ? progress.attempts
    : Array.isArray(progress.quizzes) ? progress.quizzes
    : [];

  // Build a map of classId -> best percentage
  const bestByClass = {};
  attempts.forEach((entry) => {
    const classId = Number(entry.classId ?? entry.class_id ?? entry.class ?? entry.lessonId);
    if (!Number.isFinite(classId)) return;
    // quizHistory entries have score & total; compute percentage
    const total = Number(entry.total);
    const score = Number(entry.score);
    let pct = Number(entry.percentage ?? entry.scorePct);
    if (!Number.isFinite(pct) && Number.isFinite(total) && total > 0 && Number.isFinite(score)) {
      pct = Math.round((score / total) * 100);
    }
    if (!Number.isFinite(pct)) return;
    const normalized = Math.min(100, Math.max(0, pct));
    if (!bestByClass[classId] || normalized > bestByClass[classId]) {
      bestByClass[classId] = normalized;
    }
  });

  // Also consider completed classes as 100%
  const completedIds = getCompletedClassIds(progress);
  completedIds.forEach((id) => {
    if (!bestByClass[id] || bestByClass[id] < 100) bestByClass[id] = 100;
  });

  // Map to lesson ids present in current view
  classes.forEach((lesson) => {
    if (bestByClass[lesson.id] !== undefined) {
      mastery[lesson.id] = bestByClass[lesson.id];
    }
  });

  return mastery;
}

// ── Review Suggestions (SRS) ──
function renderReviewSuggestions(classes, quizHistory) {
  const container = document.getElementById('classes-suggestions');
  if (!container) return;

  // Determine classes with mistakes (below 70% or failed attempts)
  const suggestions = [];
  const attempts = Array.isArray(quizHistory) ? quizHistory : [];

  const mistakeCountByClass = {};
  attempts.forEach((entry) => {
    const classId = Number(entry.classId ?? entry.class_id ?? entry.class ?? entry.lessonId);
    if (!Number.isFinite(classId)) return;
    const total = Number(entry.total);
    const score = Number(entry.score);
    let pct = Number(entry.percentage ?? entry.scorePct);
    if (!Number.isFinite(pct) && Number.isFinite(total) && total > 0 && Number.isFinite(score)) {
      pct = Math.round((score / total) * 100);
    }
    if (!Number.isFinite(pct)) return;
    if (pct < 70) {
      mistakeCountByClass[classId] = (mistakeCountByClass[classId] || 0) + 1;
    }
  });

  classes.forEach((lesson) => {
    const mistakes = mistakeCountByClass[lesson.id] || 0;
    if (mistakes > 0) {
      suggestions.push({ lesson, mistakes });
    }
  });

  // Sort by most mistakes first
  suggestions.sort((a, b) => b.mistakes - a.mistakes);

  if (suggestions.length === 0) {
    container.innerHTML = `
      <div class="suggestions-empty">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        ${t('classes.suggestionsEmpty')}
      </div>`;
    return;
  }

  const warningIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

  container.innerHTML = `
    <div class="section-head">
      <span class="kicker">${t('classes.suggestionsTitle')}</span>
      <h3>${t('classes.suggestionsSubtitle')}</h3>
    </div>
    <div class="suggestions-modern-grid">
      ${suggestions.map(({ lesson, mistakes }) => `
        <div class="suggestion-card-modern" data-suggestion-class="${lesson.id}">
          <span class="suggestion-card-icon">${warningIcon}</span>
          <div class="suggestion-card-body">
            <h4>${escapeHtml(translateClassTitle(lesson.title))}</h4>
            <p>${t('classes.suggestionsMistakes', mistakes)}</p>
          </div>
          <div class="suggestion-card-actions">
            <button class="btn-modern btn-modern-primary" type="button" data-review-class="${lesson.id}">${t('classes.suggestionsReview')}</button>
          </div>
        </div>`).join('')}
    </div>`;

  container.querySelectorAll('[data-review-class]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const classId = Number(btn.dataset.reviewClass);
      const lesson = classes.find((c) => c.id === classId);
      if (lesson) {
        // Open flashcards for review
        openFlashcards(lesson);
      }
    });
  });
}

// ── Flashcards Mode ──
function openFlashcards(lesson) {
  const terms = lesson.content || [];
  if (!terms.length) {
    showToast(t('classes.noQuizContent'), 'warning');
    return;
  }

  const classTitle = translateClassTitle(lesson.title);
  const currentLang = getCurrentLang();
  const shuffled = shuffleArray(terms);
  let currentIndex = 0;
  let knownCount = 0;

  const overlay = document.createElement('div');
  overlay.className = 'quiz-overlay';
  overlay.innerHTML = `
    <div class="flashcard-modal" role="dialog" aria-label="${escapeHtml(classTitle)}">
      <h2>${t('classes.flashcardsTitle')}</h2>
      <p class="flashcard-counter">${t('classes.flashcardsCard', 1, shuffled.length)}</p>
      <div class="flashcard-card" id="flashcard-card">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-face-front">
            <span id="flashcard-spanish">${escapeHtml(shuffled[0].spanish)}</span>
          </div>
          <div class="flashcard-face flashcard-face-back">
            <span class="flashcard-english" id="flashcard-english">${escapeHtml(shuffled[0].english)}</span>
            <span class="flashcard-example" id="flashcard-example">${escapeHtml(buildExamplePair(lesson, shuffled[0])[currentLang === 'en' ? 'english' : 'spanish'])}</span>
          </div>
        </div>
      </div>
      <p class="flashcard-hint">${t('classes.flashcardsFlip')}</p>
      <div class="flashcard-actions">
        <button class="btn-modern btn-modern-ghost" type="button" id="flashcard-known">${t('classes.flashcardsKnown')}</button>
        <button class="btn-modern btn-modern-primary" type="button" id="flashcard-unknown">${t('classes.flashcardsUnknown')}</button>
      </div>
      <div class="flashcard-nav">
        <button class="btn-modern btn-modern-ghost" type="button" id="flashcard-prev">${t('classes.flashcardsPrev')}</button>
        <button class="btn-modern btn-modern-ghost" type="button" id="flashcard-next">${t('classes.flashcardsNext')}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const card = overlay.querySelector('#flashcard-card');
  const spanishEl = overlay.querySelector('#flashcard-spanish');
  const englishEl = overlay.querySelector('#flashcard-english');
  const exampleEl = overlay.querySelector('#flashcard-example');
  const counterEl = overlay.querySelector('.flashcard-counter');

  function renderCard() {
    const term = shuffled[currentIndex];
    spanishEl.textContent = term.spanish;
    englishEl.textContent = term.english;
    exampleEl.textContent = buildExamplePair(lesson, term)[currentLang === 'en' ? 'english' : 'spanish'];
    counterEl.textContent = t('classes.flashcardsCard', currentIndex + 1, shuffled.length);
    card.classList.remove('flipped');
  }

  function showDone() {
    overlay.querySelector('.flashcard-modal').innerHTML = `
      <div class="flashcard-done">
        <h3>${t('classes.flashcardsDone')}</h3>
        <p>${t('classes.flashcardsKnown')}: ${knownCount} / ${shuffled.length}</p>
        <button class="btn-modern btn-modern-primary" type="button" id="flashcard-close">${t('ui.close')}</button>
      </div>`;
    overlay.querySelector('#flashcard-close').addEventListener('click', () => overlay.remove());
  }

  card.addEventListener('click', () => card.classList.toggle('flipped'));

  overlay.querySelector('#flashcard-known').addEventListener('click', () => {
    knownCount++;
    if (currentIndex < shuffled.length - 1) {
      currentIndex++;
      renderCard();
    } else {
      showDone();
    }
  });

  overlay.querySelector('#flashcard-unknown').addEventListener('click', () => {
    if (currentIndex < shuffled.length - 1) {
      currentIndex++;
      renderCard();
    } else {
      showDone();
    }
  });

  overlay.querySelector('#flashcard-prev').addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCard();
    }
  });

  overlay.querySelector('#flashcard-next').addEventListener('click', () => {
    if (currentIndex < shuffled.length - 1) {
      currentIndex++;
      renderCard();
    }
  });

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.remove(); });
}

// ── Writing Practice Mode ──
function openWritingPractice(lesson) {
  const terms = lesson.content || [];
  if (!terms.length) {
    showToast(t('classes.noQuizContent'), 'warning');
    return;
  }

  const classTitle = translateClassTitle(lesson.title);
  const shuffled = shuffleArray(terms);
  let currentIndex = 0;
  let score = 0;

  const overlay = document.createElement('div');
  overlay.className = 'quiz-overlay';
  overlay.innerHTML = `
    <div class="writing-modal" role="dialog" aria-label="${escapeHtml(classTitle)}">
      <h2>${t('classes.writingTitle')}</h2>
      <p class="writing-counter">${t('classes.flashcardsCard', 1, shuffled.length)}</p>
      <div class="writing-term-display">
        <span class="writing-term-text" id="writing-term">${escapeHtml(shuffled[0].spanish)}</span>
      </div>
      <div class="writing-input-wrap">
        <input type="text" id="writing-input" placeholder="${t('classes.writingPlaceholder')}" autocomplete="off">
      </div>
      <div id="writing-feedback"></div>
      <div class="writing-actions">
        <span class="writing-score" id="writing-score">${t('classes.writingScore', 0, shuffled.length)}</span>
        <button class="btn-modern btn-modern-primary" type="button" id="writing-check">${t('classes.writingCheck')}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const termEl = overlay.querySelector('#writing-term');
  const inputEl = overlay.querySelector('#writing-input');
  const feedbackEl = overlay.querySelector('#writing-feedback');
  const scoreEl = overlay.querySelector('#writing-score');
  const checkBtn = overlay.querySelector('#writing-check');

  function renderTerm() {
    termEl.textContent = shuffled[currentIndex].spanish;
    inputEl.value = '';
    inputEl.focus();
    feedbackEl.innerHTML = '';
    overlay.querySelector('.writing-counter').textContent = t('classes.flashcardsCard', currentIndex + 1, shuffled.length);
    scoreEl.textContent = t('classes.writingScore', score, shuffled.length);
  }

  function showDone() {
    overlay.querySelector('.writing-modal').innerHTML = `
      <div class="writing-done">
        <h3>${t('classes.writingDone')}</h3>
        <p>${t('classes.writingScore', score, shuffled.length)}</p>
        <button class="btn-modern btn-modern-primary" type="button" id="writing-close">${t('ui.close')}</button>
      </div>`;
    overlay.querySelector('#writing-close').addEventListener('click', () => overlay.remove());
  }

  function checkAnswer() {
    const answer = inputEl.value.trim().toLowerCase();
    const correct = String(shuffled[currentIndex].english || '').trim().toLowerCase();
    const isCorrect = answer === correct;

    if (isCorrect) score++;

    feedbackEl.innerHTML = isCorrect
      ? `<div class="writing-feedback correct">${t('classes.writingCorrect')}</div>`
      : `<div class="writing-feedback incorrect">${t('classes.writingIncorrect', escapeHtml(shuffled[currentIndex].english))}</div>`;

    scoreEl.textContent = t('classes.writingScore', score, shuffled.length);

    setTimeout(() => {
      if (currentIndex < shuffled.length - 1) {
        currentIndex++;
        renderTerm();
      } else {
        showDone();
      }
    }, 1200);
  }

  checkBtn.addEventListener('click', checkAnswer);
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.remove(); });
}

// ── Level Tabs ──
document.querySelectorAll('.level-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.level-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentLevelFilter = tab.dataset.level || '';
    saveClassFilters(getCurrentClassFilters());
    loadClasses(1);
  });
});

// ── Search ──
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

document.getElementById('speech-language')?.addEventListener('change', (event) => {
  const mode = setSpeechMode(event.target.value);
  // Keep profile voice preference in sync (rfa-voice: 'english'/'spanish')
  localStorage.setItem('rfa-voice', mode === 'es' ? 'spanish' : 'english');
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
