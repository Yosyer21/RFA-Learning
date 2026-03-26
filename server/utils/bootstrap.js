const { readJson, writeJson } = require('./db');
const { hashPassword } = require('./hash');

async function ensureConfig() {
  const defaults = {
    projectName: 'RFA.Learning',
    port: 3000,
    defaultLanguage: 'es',
    registrationEnabled: false,
    sessionSecret: 'rfa-learning-dev-secret-change-this',
  };

  const config = await readJson('config.json', null);
  if (!config || typeof config !== 'object') {
    await writeJson('config.json', defaults);
    return defaults;
  }

  const merged = { ...defaults, ...config };
  await writeJson('config.json', merged);
  return merged;
}

async function ensureUsers() {
  const users = await readJson('users.json', []);

  if (!Array.isArray(users) || users.length === 0) {
    const defaultAdmin = {
      id: 1,
      name: 'Admin',
      username: 'admin',
      password: await hashPassword('Admin1234'),
      role: 'admin',
      active: true,
      mustChangePassword: true,
    };

    await writeJson('users.json', [defaultAdmin]);
    return;
  }

  const normalizedUsers = users.map((user) => ({
    ...user,
    mustChangePassword:
      typeof user.mustChangePassword === 'boolean'
        ? user.mustChangePassword
        : user.username === 'admin',
  }));

  await writeJson('users.json', normalizedUsers);
}

async function ensureClasses() {
  const classes = await readJson('clases.json', []);
  if (!Array.isArray(classes) || classes.length === 0) {
    await writeJson('clases.json', [
      {
        id: 1,
        title: 'Basic Football Vocabulary',
        category: 'Vocabulary',
        level: 'Beginner',
        content: [
          { spanish: 'portero', english: 'goalkeeper' },
          { spanish: 'defensa', english: 'defender' },
          { spanish: 'mediocampista', english: 'midfielder' },
          { spanish: 'delantero', english: 'striker' },
        ],
      },
    ]);
    return;
  }

  await writeJson('clases.json', classes);
}

async function ensureProgress() {
  const progress = await readJson('progress.json', []);
  if (!Array.isArray(progress)) {
    await writeJson('progress.json', []);
    return;
  }

  await writeJson('progress.json', progress);
}

async function bootstrapDatabase() {
  const config = await ensureConfig();
  await ensureUsers();
  await ensureClasses();
  await ensureProgress();
  return config;
}

module.exports = {
  bootstrapDatabase,
};
