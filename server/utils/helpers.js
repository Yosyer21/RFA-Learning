function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function normalizeText(value = '') {
  return String(value).trim();
}

function normalizeComparableText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(([^)]*)\)/g, ' $1 ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTranslationVariants(value = '') {
  const base = normalizeComparableText(value);
  if (!base) return [];

  const variants = new Set([base]);
  const strippedParentheses = base.replace(/\b(?:gk|cb|rcb|lcb|rb|lb|rwb|lwb|cm|cdm|cam|rm|lm|rw|lw|st|ss|var|xg|xa)\b/g, '').replace(/\s+/g, ' ').trim();
  if (strippedParentheses) {
    variants.add(strippedParentheses);
  }

  return Array.from(variants).filter(Boolean);
}

function matchesTranslation(expected, answer) {
  const normalizedAnswer = normalizeComparableText(answer);
  if (!normalizedAnswer) return false;

  return normalizeTranslationVariants(expected).some((variant) => variant === normalizedAnswer);
}

module.exports = {
  publicUser,
  normalizeText,
  normalizeComparableText,
  matchesTranslation,
};
