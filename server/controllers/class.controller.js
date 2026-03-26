const { query } = require('../utils/db');
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
  const result = await query('SELECT * FROM classes ORDER BY id');
  return res.json(result.rows);
}

async function createClass(req, res) {
  const title = normalizeText(req.body.title);
  const category = normalizeText(req.body.category) || 'Vocabulary';
  const level = normalizeText(req.body.level) || 'Beginner';
  const content = parseContent(req.body.content);

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const result = await query(
    'INSERT INTO classes (title, category, level, content) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, category, level, JSON.stringify(content)]
  );

  return res.status(201).json(result.rows[0]);
}

async function updateClass(req, res) {
  const id = Number(req.params.id);

  const existing = await query('SELECT * FROM classes WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'Class not found' });
  }

  const item = existing.rows[0];
  const title = normalizeText(req.body.title) || item.title;
  const category = normalizeText(req.body.category) || item.category;
  const level = normalizeText(req.body.level) || item.level;
  let content = item.content;

  if (Array.isArray(req.body.content) || typeof req.body.content === 'string') {
    content = parseContent(req.body.content);
  }

  const result = await query(
    'UPDATE classes SET title = $1, category = $2, level = $3, content = $4 WHERE id = $5 RETURNING *',
    [title, category, level, JSON.stringify(content), id]
  );

  return res.json(result.rows[0]);
}

async function deleteClass(req, res) {
  const id = Number(req.params.id);

  const result = await query('DELETE FROM classes WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Class not found' });
  }

  return res.json({ message: 'Class deleted' });
}

async function getProgress(req, res) {
  if (req.user.role === 'admin') {
    const result = await query('SELECT id, user_id AS "userId", completed_classes AS "completedClasses", current_level AS "currentLevel", score FROM progress');
    return res.json(result.rows);
  }

  const result = await query(
    'SELECT id, user_id AS "userId", completed_classes AS "completedClasses", current_level AS "currentLevel", score FROM progress WHERE user_id = $1',
    [req.user.id]
  );

  const ownProgress = result.rows[0] || {
    userId: req.user.id,
    completedClasses: [],
    currentLevel: 'Beginner',
    score: 0,
  };

  return res.json(ownProgress);
}

async function updateProgress(req, res) {
  const userId = req.user.role === 'admin' && req.body.userId ? Number(req.body.userId) : req.user.id;

  const existing = await query('SELECT * FROM progress WHERE user_id = $1', [userId]);
  let entry;

  if (existing.rows.length === 0) {
    const completedClasses = Array.isArray(req.body.completedClasses) ? req.body.completedClasses : [];
    const currentLevel = normalizeText(req.body.currentLevel) || 'Beginner';
    const score = typeof req.body.score === 'number' ? req.body.score : 0;

    const result = await query(
      'INSERT INTO progress (user_id, completed_classes, current_level, score) VALUES ($1, $2, $3, $4) RETURNING user_id AS "userId", completed_classes AS "completedClasses", current_level AS "currentLevel", score',
      [userId, JSON.stringify(completedClasses), currentLevel, score]
    );
    entry = result.rows[0];
  } else {
    const current = existing.rows[0];
    const completedClasses = Array.isArray(req.body.completedClasses) ? req.body.completedClasses : current.completed_classes;
    const currentLevel = normalizeText(req.body.currentLevel) || current.current_level;
    const score = typeof req.body.score === 'number' ? req.body.score : current.score;

    const result = await query(
      'UPDATE progress SET completed_classes = $1, current_level = $2, score = $3 WHERE user_id = $4 RETURNING user_id AS "userId", completed_classes AS "completedClasses", current_level AS "currentLevel", score',
      [JSON.stringify(completedClasses), currentLevel, score, userId]
    );
    entry = result.rows[0];
  }

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
