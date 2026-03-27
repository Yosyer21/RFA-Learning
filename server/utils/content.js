function normalizePair(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const spanish = String(item.spanish ?? '').trim();
  const english = String(item.english ?? '').trim();

  if (!spanish || !english) {
    return null;
  }

  return { spanish, english };
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
  parseClassContent,
  parseCsv,
  parseCsvRows,
};
