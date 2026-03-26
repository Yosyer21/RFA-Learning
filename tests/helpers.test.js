const { normalizeText, publicUser } = require('../server/utils/helpers');

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

  describe('publicUser', () => {
    test('removes password from user object', () => {
      const user = { id: 1, name: 'Test', username: 'test', password: 'secret', role: 'student' };
      const result = publicUser(user);
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({ id: 1, name: 'Test', username: 'test', role: 'student' });
    });
  });
});
