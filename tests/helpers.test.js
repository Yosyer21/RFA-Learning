const {
  normalizeText,
  normalizeComparableText,
  matchesTranslation,
  publicUser,
} = require('../server/utils/helpers');

describe('helpers', () => {
  describe('normalizeText', () => {
    test('trims whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello');
    });

    test('handles undefined', () => {
      expect(normalizeText()).toBe('');
    });

    test('converts numbers to string', () => {
      expect(normalizeText(123)).toBe('123');
    });
  });

  describe('normalizeComparableText', () => {
    test('removes accents and punctuation', () => {
      expect(normalizeComparableText('¡Qué golazo!')).toBe('que golazo');
    });

    test('normalizes parenthetical abbreviations', () => {
      expect(normalizeComparableText('goalkeeper (GK)')).toBe('goalkeeper gk');
    });
  });

  describe('matchesTranslation', () => {
    test('accepts exact normalized match', () => {
      expect(matchesTranslation('What a goal!', 'what a goal')).toBe(true);
    });

    test('accepts accent-insensitive match', () => {
      expect(matchesTranslation('fútbol', 'Futbol')).toBe(true);
    });

    test('accepts match without parenthetical notes', () => {
      expect(matchesTranslation('goalkeeper (GK)', 'goalkeeper')).toBe(true);
    });

    test('rejects different translations', () => {
      expect(matchesTranslation('goalkeeper', 'defender')).toBe(false);
    });
  });

  describe('publicUser', () => {
    test('removes password from user object', () => {
      const user = { id: 1, name: 'Test', username: 'test', password: 'secret', role: 'student' };
      const result = publicUser(user);
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({ id: 1, name: 'Test', username: 'test', role: 'student' });
    });
  });
});
