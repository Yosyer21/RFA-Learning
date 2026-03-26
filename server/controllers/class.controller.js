const { readJson, writeJson, nextId } = require('../utils/db');
const { normalizeText } = require('../utils/helpers');

function parseContent(rawContent) {
  if (Array.isArray(rawContent)) {
    return rawContent;
  }

  if (typeof rawContent !== 'string') {
    return [];
  }

  return rawContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [spanish, english] = line.split('|').map((item) => (item || '').trim());
      return { spanish, english };
    })
    .filter((item) => item.spanish && item.english);
}

async function getClasses(_req, res) {
  const classes = await readJson('clases.json', []);
  return res.json(classes);
}

async function createClass(req, res) {
  const classes = await readJson('clases.json', []);
  const title = normalizeText(req.body.title);
  const category = normalizeText(req.body.category) || 'Vocabulary';
  const level = normalizeText(req.body.level) || 'Beginner';
  const content = parseContent(req.body.content);

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const newClass = {
    id: nextId(classes),
    title,
    category,
    level,
    content,
  };

  classes.push(newClass);
  await writeJson('clases.json', classes);
  return res.status(201).json(newClass);
}

async function updateClass(req, res) {
  const classes = await readJson('clases.json', []);
  const id = Number(req.params.id);
  const item = classes.find((entry) => entry.id === id);

  if (!item) {
    return res.status(404).json({ message: 'Class not found' });
  }

  const title = normalizeText(req.body.title);
  const category = normalizeText(req.body.category);
  const level = normalizeText(req.body.level);

  if (title) item.title = title;
  if (category) item.category = category;
  if (level) item.level = level;
  if (Array.isArray(req.body.content) || typeof req.body.content === 'string') {
    item.content = parseContent(req.body.content);
  }

  await writeJson('clases.json', classes);
  return res.json(item);
}

async function deleteClass(req, res) {
  const classes = await readJson('clases.json', []);
  const id = Number(req.params.id);

  if (!classes.some((item) => item.id === id)) {
    return res.status(404).json({ message: 'Class not found' });
  }

  await writeJson('clases.json', classes.filter((item) => item.id !== id));
  return res.json({ message: 'Class deleted' });
}

async function getProgress(req, res) {
  const progress = await readJson('progress.json', []);

  if (req.user.role === 'admin') {
    return res.json(progress);
  }

  const ownProgress = progress.find((item) => item.userId === req.user.id) || {
    userId: req.user.id,
    completedClasses: [],
    currentLevel: 'Beginner',
    score: 0,
  };

  return res.json(ownProgress);
}

async function updateProgress(req, res) {
  const progress = await readJson('progress.json', []);
  const userId = req.user.role === 'admin' && req.body.userId ? Number(req.body.userId) : req.user.id;

  let entry = progress.find((item) => item.userId === userId);
  if (!entry) {
    entry = {
      userId,
      completedClasses: [],
      currentLevel: 'Beginner',
      score: 0,
    };
    progress.push(entry);
  }

  if (Array.isArray(req.body.completedClasses)) entry.completedClasses = req.body.completedClasses;
  if (normalizeText(req.body.currentLevel)) entry.currentLevel = normalizeText(req.body.currentLevel);
  if (typeof req.body.score === 'number') entry.score = req.body.score;

  await writeJson('progress.json', progress);
  return res.json(entry);
}

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getProgress,
  updateProgress,
};
