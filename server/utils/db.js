const fs = require('fs/promises');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..', 'Database');

function resolveDbFile(fileName) {
  return path.join(DB_DIR, fileName);
}

async function readJson(fileName, fallback = []) {
  const filePath = resolveDbFile(fileName);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(fileName, data) {
  const filePath = resolveDbFile(fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((item) => Number(item.id) || 0)) + 1;
}

module.exports = {
  DB_DIR,
  readJson,
  writeJson,
  nextId,
};
