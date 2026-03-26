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

async function getClasses(req, res) {
  const { search, category, level, page, limit } = req.query;

  let sql = 'SELECT * FROM classes';
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(LOWER(title) LIKE $${paramIndex} OR LOWER(category) LIKE $${paramIndex})`);
    params.push(`%${search.toLowerCase()}%`);
    paramIndex++;
  }

  if (category) {
    conditions.push(`LOWER(category) = $${paramIndex}`);
    params.push(category.toLowerCase());
    paramIndex++;
  }

  if (level) {
    conditions.push(`LOWER(level) = $${paramIndex}`);
    params.push(level.toLowerCase());
    paramIndex++;
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  // Count total for pagination
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].count, 10);

  sql += ' ORDER BY id';

  // Pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * pageSize;

  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(pageSize, offset);

  const result = await query(sql, params);

  return res.json({
    data: result.rows,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    },
  });
}

async function createClass(req, res) {
  const { title, category, level } = req.body;
  const content = parseContent(req.body.content);

  const result = await query(
    'INSERT INTO classes (title, category, level, content) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, category || 'Vocabulary', level || 'Beginner', JSON.stringify(content)]
  );

  return res.status(201).json(result.rows[0]);
}

async function updateClass(req, res) {
  const id = Number(req.params.id);

  const existing = await query('SELECT * FROM classes WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'Clase no encontrada' });
  }

  const item = existing.rows[0];
  const title = req.body.title || item.title;
  const category = req.body.category || item.category;
  const level = req.body.level || item.level;
  let content = item.content;

  if (req.body.content !== undefined) {
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
    return res.status(404).json({ message: 'Clase no encontrada' });
  }

  return res.json({ message: 'Clase eliminada' });
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

async function importClassesCsv(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Archivo CSV requerido' });
  }

  const csvText = req.file.buffer.toString('utf-8');
  const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    return res.status(400).json({ message: 'El CSV debe tener al menos un encabezado y una fila' });
  }

  // Expect header: title,category,level,spanish,english
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const titleIdx = header.indexOf('title');
  const catIdx = header.indexOf('category');
  const levelIdx = header.indexOf('level');
  const spIdx = header.indexOf('spanish');
  const enIdx = header.indexOf('english');

  if (titleIdx === -1 || spIdx === -1 || enIdx === -1) {
    return res.status(400).json({ message: 'El CSV debe tener columnas: title, spanish, english (category y level opcionales)' });
  }

  // Group by title
  const classesMap = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const title = cols[titleIdx];
    if (!title) continue;

    if (!classesMap[title]) {
      classesMap[title] = {
        title,
        category: cols[catIdx] || 'Vocabulary',
        level: cols[levelIdx] || 'Beginner',
        content: [],
      };
    }

    const spanish = cols[spIdx];
    const english = cols[enIdx];
    if (spanish && english) {
      classesMap[title].content.push({ spanish, english });
    }
  }

  const imported = [];
  for (const cls of Object.values(classesMap)) {
    const result = await query(
      'INSERT INTO classes (title, category, level, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [cls.title, cls.category, cls.level, JSON.stringify(cls.content)]
    );
    imported.push(result.rows[0]);
  }

  return res.status(201).json({ message: `${imported.length} clase(s) importadas`, classes: imported });
}

async function submitQuiz(req, res) {
  const { classId, answers } = req.body;
  const userId = req.user.id;

  if (!classId || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'classId y answers son requeridos' });
  }

  // Get the class to validate answers
  const classResult = await query('SELECT * FROM classes WHERE id = $1', [classId]);
  if (classResult.rows.length === 0) {
    return res.status(404).json({ message: 'Clase no encontrada' });
  }

  const classContent = classResult.rows[0].content;
  let score = 0;
  const total = answers.length;

  const graded = answers.map((a) => {
    const term = classContent.find((t) => t.spanish === a.spanish);
    const correct = term && term.english.toLowerCase() === (a.answer || '').toLowerCase();
    if (correct) score++;
    return { spanish: a.spanish, answer: a.answer, correct, expected: term?.english || '' };
  });

  // Save quiz result
  const result = await query(
    'INSERT INTO quizzes (class_id, user_id, score, total, answers) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [classId, userId, score, total, JSON.stringify(graded)]
  );

  // Auto-update progress: mark class as completed if score >= 70%
  if (total > 0 && (score / total) >= 0.7) {
    const progressResult = await query('SELECT * FROM progress WHERE user_id = $1', [userId]);
    if (progressResult.rows.length === 0) {
      await query(
        'INSERT INTO progress (user_id, completed_classes, current_level, score) VALUES ($1, $2, $3, $4)',
        [userId, JSON.stringify([classId]), 'Beginner', score]
      );
    } else {
      const current = progressResult.rows[0];
      const completed = Array.isArray(current.completed_classes) ? current.completed_classes : [];
      if (!completed.includes(classId)) {
        completed.push(classId);
        await query(
          'UPDATE progress SET completed_classes = $1, score = score + $2 WHERE user_id = $3',
          [JSON.stringify(completed), score, userId]
        );
      }
    }
  }

  return res.json({
    quizId: result.rows[0].id,
    score,
    total,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    passed: total > 0 && (score / total) >= 0.7,
    answers: graded,
  });
}

async function getQuizHistory(req, res) {
  const userId = req.user.id;
  const result = await query(
    `SELECT q.id, q.class_id AS "classId", c.title AS "classTitle", q.score, q.total, q.completed_at AS "completedAt"
     FROM quizzes q JOIN classes c ON q.class_id = c.id
     WHERE q.user_id = $1 ORDER BY q.completed_at DESC LIMIT 50`,
    [userId]
  );
  return res.json(result.rows);
}

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getProgress,
  updateProgress,
  importClassesCsv,
  submitQuiz,
  getQuizHistory,
};
