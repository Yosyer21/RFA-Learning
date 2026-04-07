process.env.LOG_LEVEL = 'error';

const request = require('supertest');
const { createApp } = require('../server/app');
const { bootstrapDatabase } = require('../server/utils/bootstrap');

async function loginAsAdmin(agent) {
  const response = await agent
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'Admin1234' });

  expect(response.status).toBe(200);
}

describe('classes routes', () => {
  const app = createApp({ sessionSecret: 'test-secret' });

  beforeAll(async () => {
    process.env.DEFAULT_ADMIN_FORCE_PASSWORD_CHANGE = 'false';
    await bootstrapDatabase();
  });

  test('exposes catalog metadata for filters', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);

    const response = await agent.get('/api/classes/meta');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.categories)).toBe(true);
    expect(Array.isArray(response.body.levels)).toBe(true);
    expect(typeof response.body.totalClasses).toBe('number');
    expect(typeof response.body.totalTerms).toBe('number');
  });
});
