const https = require('https');
const crypto = require('crypto');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const SHEET_PRODUCT_PATTERN = /football language system/i;
const PAID_PATTERNS = [
  /^(paid|pagado|pago confirmado|confirmed|approved|completed|success|done)$/i,
  /pagad[oa]/i,
  /aprobad[oa]/i,
  /completad[oa]/i,
  /confirmad[oa]/i,
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let cachedIdentifiers = null;
let cachedAt = 0;
let cachedAccessToken = null;
let accessTokenExpiresAt = 0;
let refreshPromise = null;
let cachedPaidAccounts = null;

function normalizeValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function toBase64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getServiceAccountConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.REGISTRATION_SHEETS_SPREADSHEET_ID || '';
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const sheetRange = process.env.GOOGLE_SHEETS_RANGE || process.env.REGISTRATION_SHEETS_RANGE || 'Sheet1!A:Z';
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.RAILWAY_GOOGLE_SERVICE_ACCOUNT_JSON || '';
  const credentialFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_FILE || '';

  return {
    spreadsheetId: spreadsheetId.trim(),
    clientEmail: clientEmail.trim(),
    privateKey,
    sheetRange: sheetRange.trim(),
    serviceAccountJson: serviceAccountJson.trim(),
    credentialFilePath: credentialFilePath.trim(),
  };
}

function loadCredentialsFromJson(jsonText) {
  if (!jsonText) {
    return null;
  }

  try {
    const parsed = JSON.parse(String(jsonText));
    return {
      clientEmail: String(parsed.client_email || '').trim(),
      privateKey: String(parsed.private_key || '').replace(/\\n/g, '\n'),
    };
  } catch (_error) {
    return null;
  }
}

function loadCredentialsFromFile(filePath) {
  if (!filePath) {
    return null;
  }

  try {
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      clientEmail: String(parsed.client_email || '').trim(),
      privateKey: String(parsed.private_key || '').replace(/\\n/g, '\n'),
    };
  } catch (_error) {
    return null;
  }
}

function hasGoogleSheetsConfig() {
  const config = getServiceAccountConfig();
  const inlineCredentials = loadCredentialsFromJson(config.serviceAccountJson);
  const fileCredentials = loadCredentialsFromFile(config.credentialFilePath);
  const effectiveCredentials = inlineCredentials || fileCredentials;

  return Boolean(
    config.spreadsheetId
    && ((config.clientEmail && config.privateKey) || (effectiveCredentials && effectiveCredentials.clientEmail && effectiveCredentials.privateKey))
  );
}

function isEmailLike(value) {
  return EMAIL_PATTERN.test(normalizeValue(value));
}

function isPaidValue(value) {
  const normalized = normalizeValue(value);
  return PAID_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isProductValue(value) {
  return SHEET_PRODUCT_PATTERN.test(normalizeValue(value));
}

function findHeaderIndex(headers, keywords) {
  return headers.findIndex((header) => keywords.some((keyword) => header.includes(keyword)));
}

function findExactHeaderIndex(headers, keywords) {
  return headers.findIndex((header) => keywords.includes(header));
}

function findHeaderIndexWithFallback(headers, exactKeywords, fallbackKeywords) {
  const exactIndex = findExactHeaderIndex(headers, exactKeywords);
  if (exactIndex >= 0) {
    return exactIndex;
  }

  return findHeaderIndex(headers, fallbackKeywords);
}

function normalizeOrderNumber(value) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return '';
  }

  const numeric = Number(normalized.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? String(Math.trunc(numeric)) : normalized;
}

function parseCurrencyValue(value) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return '';
  }

  return normalized.toUpperCase();
}

function parseMoneyValue(value) {
  const normalized = String(value ?? '').trim().replace(/,/g, '');
  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function extractRecordFromRow(row, headers) {
  const normalizedCells = row.map((cell) => normalizeValue(cell));
  const productIndex = findHeaderIndexWithFallback(
    headers,
    ['line item name', 'product', 'service', 'plan', 'course', 'item'],
    ['line item name', 'product', 'service', 'plan', 'course']
  );
  const statusIndex = findHeaderIndexWithFallback(
    headers,
    ['financial status', 'payment status', 'order status', 'status', 'paid'],
    ['financial status', 'payment status', 'order status', 'status']
  );
  const emailIndex = findHeaderIndex(headers, ['email', 'correo', 'customer email']);
  const orderIndex = findHeaderIndex(headers, ['order number', 'order', 'order id', 'id']);
  const paidAtIndex = findHeaderIndex(headers, ['paid at', 'payment date', 'date paid']);
  const createdAtIndex = findHeaderIndex(headers, ['created at', 'created']);
  const billingNameIndex = findHeaderIndex(headers, ['billing name', 'customer name', 'full name']);
  const totalIndex = findHeaderIndex(headers, ['total', 'amount']);
  const currencyIndex = findHeaderIndex(headers, ['currency']);
  const fulfillmentIndex = findHeaderIndex(headers, ['fulfillment status', 'fulfilled status']);

  const hasProduct = productIndex >= 0
    ? isProductValue(row[productIndex])
    : normalizedCells.some((cell) => isProductValue(cell));

  const hasPaid = statusIndex >= 0
    ? isPaidValue(row[statusIndex])
    : normalizedCells.some((cell) => isPaidValue(cell));

  if (!hasProduct || !hasPaid) {
    return null;
  }

  const email = emailIndex >= 0 && row[emailIndex]
    ? normalizeValue(row[emailIndex])
    : row.find((cell) => isEmailLike(cell))
      ? normalizeValue(row.find((cell) => isEmailLike(cell)))
      : '';

  if (!email) {
    return null;
  }

  return {
    orderNumber: orderIndex >= 0 ? normalizeOrderNumber(row[orderIndex]) : '',
    email,
    customerName: billingNameIndex >= 0 ? String(row[billingNameIndex] ?? '').trim() : '',
    product: productIndex >= 0 ? String(row[productIndex] ?? '').trim() : '',
    financialStatus: statusIndex >= 0 ? String(row[statusIndex] ?? '').trim() : '',
    paidAt: paidAtIndex >= 0 ? String(row[paidAtIndex] ?? '').trim() : '',
    createdAt: createdAtIndex >= 0 ? String(row[createdAtIndex] ?? '').trim() : '',
    currency: currencyIndex >= 0 ? parseCurrencyValue(row[currencyIndex]) : '',
    total: totalIndex >= 0 ? parseMoneyValue(row[totalIndex]) : null,
    fulfillmentStatus: fulfillmentIndex >= 0 ? String(row[fulfillmentIndex] ?? '').trim() : '',
  };
}

function extractIdentifierFromRow(row, identifierIndex) {
  if (identifierIndex >= 0 && row[identifierIndex]) {
    return normalizeValue(row[identifierIndex]);
  }

  const emailCell = row.find((cell) => isEmailLike(cell));
  if (emailCell) {
    return normalizeValue(emailCell);
  }

  const fallbackCell = row.find((cell) => {
    const normalized = normalizeValue(cell);
    return normalized && !isProductValue(normalized) && !isPaidValue(normalized);
  });

  return fallbackCell ? normalizeValue(fallbackCell) : '';
}

function collectEligibleIdentifiersFromRows(rows) {
  const eligibleIdentifiers = new Set();

  for (const row of rows) {
    if (!Array.isArray(row)) {
      continue;
    }

    const normalizedCells = row.map((cell) => normalizeValue(cell));
    const hasProduct = normalizedCells.some((cell) => isProductValue(cell));
    const hasPaid = normalizedCells.some((cell) => isPaidValue(cell));

    if (!hasProduct || !hasPaid) {
      continue;
    }

    const identifier = extractIdentifierFromRow(row, -1);
    if (identifier) {
      eligibleIdentifiers.add(identifier);
    }
  }

  return eligibleIdentifiers;
}

function extractEligibleIdentifiersFromSheet(values) {
  const rows = Array.isArray(values)
    ? values.filter((row) => Array.isArray(row) && row.some((cell) => normalizeValue(cell)))
    : [];

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((cell) => normalizeValue(cell));
  const productIndex = findHeaderIndexWithFallback(
    headers,
    ['line item name', 'product', 'service', 'plan', 'course', 'item'],
    ['line item name', 'product', 'service', 'plan', 'course']
  );
  const statusIndex = findHeaderIndexWithFallback(
    headers,
    ['financial status', 'payment status', 'order status', 'status', 'paid'],
    ['financial status', 'payment status', 'order status', 'status']
  );
  const identifierIndex = findHeaderIndex(headers, ['email', 'correo', 'username', 'usuario', 'account', 'cuenta', 'client']);

  const eligibleIdentifiers = new Set();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const normalizedCells = row.map((cell) => normalizeValue(cell));

    const hasProduct = productIndex >= 0
      ? isProductValue(row[productIndex])
      : normalizedCells.some((cell) => isProductValue(cell));

    const hasPaid = statusIndex >= 0
      ? isPaidValue(row[statusIndex])
      : normalizedCells.some((cell) => isPaidValue(cell));

    if (!hasProduct || !hasPaid) {
      continue;
    }

    const identifier = extractIdentifierFromRow(row, identifierIndex);
    if (identifier) {
      eligibleIdentifiers.add(identifier);
    }
  }

  if (eligibleIdentifiers.size === 0) {
    collectEligibleIdentifiersFromRows(rows).forEach((identifier) => eligibleIdentifiers.add(identifier));
  }

  return Array.from(eligibleIdentifiers);
}

function extractPaidRegistrationAccountsFromSheet(values) {
  const rows = Array.isArray(values)
    ? values.filter((row) => Array.isArray(row) && row.some((cell) => normalizeValue(cell)))
    : [];

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((cell) => normalizeValue(cell));
  const records = [];
  const seenEmails = new Set();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const record = extractRecordFromRow(rows[rowIndex], headers);
    if (!record || seenEmails.has(record.email)) {
      continue;
    }

    seenEmails.add(record.email);
    records.push(record);
  }

  return records;
}

function postForm(url, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');

      response.on('data', (chunk) => {
        raw += chunk;
      });

      response.on('end', () => {
        let parsedBody = raw;

        try {
          parsedBody = raw ? JSON.parse(raw) : {};
        } catch (_error) {
          parsedBody = raw;
        }

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsedBody);
          return;
        }

        const error = new Error('Google token request failed');
        error.statusCode = response.statusCode;
        error.body = parsedBody;
        reject(error);
      });
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (response) => {
      let raw = '';
      response.setEncoding('utf8');

      response.on('data', (chunk) => {
        raw += chunk;
      });

      response.on('end', () => {
        let parsedBody = raw;

        try {
          parsedBody = raw ? JSON.parse(raw) : {};
        } catch (_error) {
          parsedBody = raw;
        }

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsedBody);
          return;
        }

        const error = new Error('Google Sheets request failed');
        error.statusCode = response.statusCode;
        error.body = parsedBody;
        reject(error);
      });
    }).on('error', reject);
  });
}

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt) {
    return cachedAccessToken;
  }

  const { clientEmail, privateKey, serviceAccountJson, credentialFilePath } = getServiceAccountConfig();
  const inlineCredentials = loadCredentialsFromJson(serviceAccountJson);
  const fileCredentials = loadCredentialsFromFile(credentialFilePath);
  const effectiveClientEmail = clientEmail || inlineCredentials?.clientEmail || fileCredentials?.clientEmail || '';
  const effectivePrivateKey = privateKey || inlineCredentials?.privateKey || fileCredentials?.privateKey || '';

  if (!effectiveClientEmail || !effectivePrivateKey) {
    throw new Error('Google service account credentials are missing');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify({
    iss: effectiveClientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }));
  const unsignedToken = `${header}.${payload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = toBase64Url(signer.sign(effectivePrivateKey));
  const assertion = `${unsignedToken}.${signature}`;
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(assertion)}`;

  const tokenResponse = await postForm(GOOGLE_TOKEN_URL, body);
  if (!tokenResponse.access_token) {
    throw new Error('Google access token was not returned');
  }

  cachedAccessToken = tokenResponse.access_token;
  accessTokenExpiresAt = Date.now() + ((Number(tokenResponse.expires_in) || 3600) - 60) * 1000;
  return cachedAccessToken;
}

async function fetchEligibleIdentifiers() {
  const { spreadsheetId, sheetRange } = getServiceAccountConfig();

  if (!spreadsheetId) {
    throw new Error('Google Sheets spreadsheet ID is missing');
  }

  const accessToken = await getAccessToken();
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetRange)}`);
  url.searchParams.set('majorDimension', 'ROWS');

  const result = await getJson(url, {
    Authorization: `Bearer ${accessToken}`,
  });

  return extractEligibleIdentifiersFromSheet(result.values || []);
}

async function loadPaidRegistrationAccounts({ forceRefresh = false } = {}) {
  const cacheLifetimeMs = Number(process.env.REGISTRATION_ELIGIBILITY_CACHE_MS || 5 * 60 * 1000);

  if (!forceRefresh && cachedPaidAccounts && Date.now() - cachedAt < cacheLifetimeMs) {
    return cachedPaidAccounts;
  }

  const { spreadsheetId, sheetRange } = getServiceAccountConfig();

  if (!spreadsheetId) {
    throw new Error('Google Sheets spreadsheet ID is missing');
  }

  const accessToken = await getAccessToken();
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetRange)}`);
  url.searchParams.set('majorDimension', 'ROWS');

  const result = await getJson(url, {
    Authorization: `Bearer ${accessToken}`,
  });

  const paidAccounts = extractPaidRegistrationAccountsFromSheet(result.values || []);
  cachedIdentifiers = Array.from(new Set(paidAccounts.map((account) => account.email).filter(Boolean)));
  cachedPaidAccounts = paidAccounts;
  cachedAt = Date.now();
  return paidAccounts;
}

async function loadEligibleIdentifiers({ forceRefresh = false } = {}) {
  const cacheLifetimeMs = Number(process.env.REGISTRATION_ELIGIBILITY_CACHE_MS || 5 * 60 * 1000);

  if (!forceRefresh && cachedIdentifiers && Date.now() - cachedAt < cacheLifetimeMs) {
    return cachedIdentifiers;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const allowList = String(process.env.REGISTRATION_ALLOWED_ACCOUNTS || '')
    .split(',')
    .map((value) => normalizeValue(value))
    .filter(Boolean);

  if (allowList.length > 0) {
    cachedIdentifiers = allowList;
    cachedAt = Date.now();
    return cachedIdentifiers;
  }

  if (!hasGoogleSheetsConfig()) {
    throw new Error('Google Sheets registration is not configured');
  }

  refreshPromise = (async () => {
    const identifiers = await fetchEligibleIdentifiers();
    cachedIdentifiers = identifiers.map((identifier) => normalizeValue(identifier));
    cachedAt = Date.now();
    return cachedIdentifiers;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function isEligibleRegistrationAccount(identifier) {
  const normalizedIdentifier = normalizeValue(identifier);
  if (!normalizedIdentifier) {
    return false;
  }

  const identifiers = await loadEligibleIdentifiers();
  return identifiers.includes(normalizedIdentifier);
}

module.exports = {
  hasGoogleSheetsConfig,
  extractEligibleIdentifiersFromSheet,
  extractPaidRegistrationAccountsFromSheet,
  loadEligibleIdentifiers,
  loadPaidRegistrationAccounts,
  isEligibleRegistrationAccount,
};