process.env.LOG_LEVEL = 'error';

const request = require('supertest');
const { createApp } = require('../server/app');

describe('auth route protection', () => {
  const app = createApp({ sessionSecret: 'test-secret' });

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
});
