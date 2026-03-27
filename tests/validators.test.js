const {
  loginSchema,
  changePasswordSchema,
  registerSchema,
  createUserSchema,
  createClassSchema,
  progressSchema,
  validate,
} = require('../server/utils/validators');

describe('validators', () => {
  describe('loginSchema', () => {
    test('accepts valid login', () => {
      const result = loginSchema.safeParse({ username: 'admin', password: 'Test1234' });
      expect(result.success).toBe(true);
    });

    test('rejects empty username', () => {
      const result = loginSchema.safeParse({ username: '', password: 'Test1234' });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    test('accepts valid registration', () => {
      const result = registerSchema.safeParse({ name: 'John', username: 'john', password: 'Test1234' });
      expect(result.success).toBe(true);
    });

    test('rejects weak password (no uppercase)', () => {
      const result = registerSchema.safeParse({ name: 'John', username: 'john', password: 'test1234' });
      expect(result.success).toBe(false);
    });

    test('rejects weak password (no number)', () => {
      const result = registerSchema.safeParse({ name: 'John', username: 'john', password: 'Testtest' });
      expect(result.success).toBe(false);
    });

    test('rejects short password', () => {
      const result = registerSchema.safeParse({ name: 'John', username: 'john', password: 'Te1' });
      expect(result.success).toBe(false);
    });

    test('rejects short username', () => {
      const result = registerSchema.safeParse({ name: 'John', username: 'ab', password: 'Test1234' });
      expect(result.success).toBe(false);
    });
  });

  describe('createUserSchema', () => {
    test('accepts valid user with defaults', () => {
      const result = createUserSchema.safeParse({ name: 'Test', username: 'test', password: 'Test1234' });
      expect(result.success).toBe(true);
      expect(result.data.role).toBe('student');
      expect(result.data.active).toBe(true);
    });

    test('coerces boolean-like string inputs', () => {
      const result = createUserSchema.safeParse({
        name: 'Test',
        username: 'TESTUSER',
        password: 'Test1234',
        active: 'false',
        mustChangePassword: 'true',
      });

      expect(result.success).toBe(true);
      expect(result.data.username).toBe('testuser');
      expect(result.data.active).toBe(false);
      expect(result.data.mustChangePassword).toBe(true);
    });

    test('rejects invalid role', () => {
      const result = createUserSchema.safeParse({ name: 'Test', username: 'test', password: 'Test1234', role: 'superadmin' });
      expect(result.success).toBe(false);
    });
  });

  describe('createClassSchema', () => {
    test('accepts valid class with string content', () => {
      const result = createClassSchema.safeParse({ title: 'Test Class', content: 'hola|hello' });
      expect(result.success).toBe(true);
    });

    test('accepts valid class with array content', () => {
      const result = createClassSchema.safeParse({
        title: 'Test Class',
        content: [{ spanish: 'hola', english: 'hello' }],
      });
      expect(result.success).toBe(true);
    });

    test('rejects empty title', () => {
      const result = createClassSchema.safeParse({ title: '', content: 'test' });
      expect(result.success).toBe(false);
    });
  });

  describe('progressSchema', () => {
    test('coerces numeric strings', () => {
      const result = progressSchema.safeParse({
        userId: '12',
        completedClasses: ['1', '2'],
        currentLevel: 'Beginner',
        score: '7',
      });

      expect(result.success).toBe(true);
      expect(result.data.userId).toBe(12);
      expect(result.data.completedClasses).toEqual([1, 2]);
      expect(result.data.score).toBe(7);
    });
  });

  describe('validate middleware', () => {
    test('calls next on valid input', () => {
      const middleware = validate(loginSchema);
      const req = { body: { username: 'admin', password: 'Test1234' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('returns 400 on invalid input', () => {
      const middleware = validate(loginSchema);
      const req = { body: { username: '', password: '' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
