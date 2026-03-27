function normalizePair(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const spanish = String(item.spanish ?? '').trim();
  const english = String(item.english ?? '').trim();
  const example = String(item.example ?? '').trim();
  const exampleSpanish = String(item.exampleSpanish ?? item.exampleEs ?? '').trim();

  if (!spanish || !english) {
    return null;
  }

  const normalized = { spanish, english };
  if (example) {
    normalized.example = example;
  }
  if (exampleSpanish) {
    normalized.exampleSpanish = exampleSpanish;
  }

  return normalized;
}

function normalizeDisplayText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildExamplePair(lesson = {}, item = {}) {
  const existingEnglish = String(item.example ?? '').trim();
  const existingSpanish = String(item.exampleSpanish ?? item.exampleEs ?? '').trim();

  if (existingEnglish || existingSpanish) {
    return {
      example: existingEnglish || '',
      exampleSpanish: existingSpanish || '',
    };
  }

  const englishTerm = String(item.english ?? '').trim();
  const spanishTerm = String(item.spanish ?? '').trim();
  const categoryKey = normalizeDisplayText(lesson.category);

  const templates = {
    posiciones: {
      example: `The coach points to the "${englishTerm}" during the tactical drill.`,
      exampleSpanish: `El entrenador señala al "${spanishTerm}" durante el ejercicio táctico.`,
    },
    acciones: {
      example: `The team practices the "${englishTerm}" in every session.`,
      exampleSpanish: `El equipo practica el "${spanishTerm}" en cada sesión.`,
    },
    arbitraje: {
      example: `The referee can stop play for "${englishTerm}".`,
      exampleSpanish: `El árbitro puede detener el juego por "${spanishTerm}".`,
    },
    tactica: {
      example: `They switch to "${englishTerm}" to control the match.`,
      exampleSpanish: `Cambian a "${spanishTerm}" para controlar el partido.`,
    },
    analisis: {
      example: `The analyst tracks "${englishTerm}" to measure performance.`,
      exampleSpanish: `El analista registra "${spanishTerm}" para medir el rendimiento.`,
    },
    comunicacion: {
      example: `The commentator describes the moment as "${englishTerm}".`,
      exampleSpanish: `El comentarista describe la jugada como "${spanishTerm}".`,
    },
  };

  return templates[categoryKey] || {
    example: `The coach uses "${englishTerm}" in context.`,
    exampleSpanish: `El entrenador usa "${spanishTerm}" en contexto.`,
  };
}

function parseClassContent(rawContent) {
  if (Array.isArray(rawContent)) {
    return rawContent.map(normalizePair).filter(Boolean);
  }

  if (typeof rawContent !== 'string') {
    return [];
  }

  return rawContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf('|');

      if (separatorIndex === -1) {
        return null;
      }

      return {
        spanish: line.slice(0, separatorIndex).trim(),
        english: line.slice(separatorIndex + 1).trim(),
      };
    })
    .map(normalizePair)
    .filter(Boolean);
}

function enrichLessonContent(lesson = {}) {
  const content = Array.isArray(lesson.content) ? lesson.content : [];

  return {
    ...lesson,
    content: content.map((item) => {
      const normalized = normalizePair(item);
      if (!normalized) {
        return null;
      }

      const example = buildExamplePair(lesson, item);
      if (example.example) {
        normalized.example = example.example;
      }
      if (example.exampleSpanish) {
        normalized.exampleSpanish = example.exampleSpanish;
      }

      return normalized;
    }).filter(Boolean),
  };
}

function parseCsvRows(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return [];
  }

  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        currentCell += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = false;
        continue;
      }

      currentCell += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    if (char === '\n') {
      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (currentRow.some((cell) => cell.trim() !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

function parseCsv(text) {
  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());

  return rows.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (row[index] ?? '').trim();
    });
    return item;
  });
}

module.exports = {
  buildExamplePair,
  enrichLessonContent,
  parseClassContent,
  parseCsv,
  parseCsvRows,
};
