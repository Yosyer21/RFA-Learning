process.env.LOG_LEVEL = 'error';

const request = require('supertest');
const { createApp } = require('../server/app');
const { bootstrapDatabase } = require('../server/utils/bootstrap');

describe('auth route protection', () => {
  const app = createApp({ sessionSecret: 'test-secret' });

  beforeAll(async () => {
    await bootstrapDatabase();
  });

  test('blocks seed-status without authentication', async () => {
    const response = await request(app).get('/api/auth/seed-status');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  test('blocks me without authentication', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  test('allows login with default local admin', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin1234' });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe('admin');
  });
});
