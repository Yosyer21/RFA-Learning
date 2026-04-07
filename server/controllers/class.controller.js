const { query, withTransaction } = require('../utils/db');
const { normalizeText, matchesTranslation } = require('../utils/helpers');
const { parseClassContent, parseCsv } = require('../utils/content');

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

async function getClassesMeta(_req, res) {
  const result = await query('SELECT id, category, level, content FROM classes ORDER BY id');
  const categories = new Set();
  const levels = new Set();
  let totalTerms = 0;

  for (const row of result.rows) {
    if (row.category) {
      categories.add(String(row.category).trim());
    }

    if (row.level) {
      levels.add(String(row.level).trim());
    }

    if (Array.isArray(row.content)) {
      totalTerms += row.content.length;
    }
  }

  return res.json({
    totalClasses: result.rows.length,
    totalTerms,
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    levels: Array.from(levels).sort((a, b) => a.localeCompare(b)),
  });
}

async function createClass(req, res) {
  const { title, category, level } = req.body;
  const content = parseClassContent(req.body.content);

  if (content.length === 0) {
    return res.status(400).json({ message: 'El contenido de la clase no puede estar vacío' });
  }

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
    content = parseClassContent(req.body.content);
    if (content.length === 0) {
      return res.status(400).json({ message: 'El contenido de la clase no puede estar vacío' });
    }
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

  const entry = await withTransaction(async (client) => {
    const existing = await client.query('SELECT * FROM progress WHERE user_id = $1 FOR UPDATE', [userId]);

    if (existing.rows.length === 0) {
      const completedClasses = Array.isArray(req.body.completedClasses) ? req.body.completedClasses : [];
      const currentLevel = normalizeText(req.body.currentLevel) || 'Beginner';
      const score = typeof req.body.score === 'number' ? req.body.score : 0;

      const result = await client.query(
        'INSERT INTO progress (user_id, completed_classes, current_level, score) VALUES ($1, $2, $3, $4) RETURNING user_id AS "userId", completed_classes AS "completedClasses", current_level AS "currentLevel", score',
        [userId, JSON.stringify(completedClasses), currentLevel, score]
      );
      return result.rows[0];
    }

    const current = existing.rows[0];
    const completedClasses = Array.isArray(req.body.completedClasses) ? req.body.completedClasses : current.completed_classes;
    const currentLevel = normalizeText(req.body.currentLevel) || current.current_level;
    const score = typeof req.body.score === 'number' ? req.body.score : current.score;

    const result = await client.query(
      'UPDATE progress SET completed_classes = $1, current_level = $2, score = $3 WHERE user_id = $4 RETURNING user_id AS "userId", completed_classes AS "completedClasses", current_level AS "currentLevel", score',
      [JSON.stringify(completedClasses), currentLevel, score, userId]
    );
    return result.rows[0];
  });

  return res.json(entry);
}

async function importClassesCsv(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Archivo CSV requerido' });
  }

  const csvText = req.file.buffer.toString('utf-8');
  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    return res.status(400).json({ message: 'El CSV debe tener al menos un encabezado y una fila' });
  }

  if (!Object.prototype.hasOwnProperty.call(rows[0], 'title')
    || !Object.prototype.hasOwnProperty.call(rows[0], 'spanish')
    || !Object.prototype.hasOwnProperty.call(rows[0], 'english')) {
    return res.status(400).json({ message: 'El CSV debe tener columnas: title, spanish, english (category y level opcionales)' });
  }

  const classesMap = {};
  for (const row of rows) {
    const title = row.title;
    if (!title) continue;

    if (!classesMap[title]) {
      classesMap[title] = {
        title,
        category: row.category || 'Vocabulary',
        level: row.level || 'Beginner',
        content: [],
      };
    }

    const spanish = row.spanish;
    const english = row.english;
    if (spanish && english) {
      classesMap[title].content.push({ spanish, english });
    }
  }

  const validClasses = Object.values(classesMap).filter((cls) => cls.content.length > 0);
  if (validClasses.length === 0) {
    return res.status(400).json({ message: 'El CSV no contiene términos válidos para importar' });
  }

  const imported = [];
  await withTransaction(async (client) => {
    for (const cls of validClasses) {
      const result = await client.query(
        'INSERT INTO classes (title, category, level, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [cls.title, cls.category, cls.level, JSON.stringify(cls.content)]
      );
      imported.push(result.rows[0]);
    }
  });

  return res.status(201).json({ message: `${imported.length} clase(s) importadas`, classes: imported });
}

async function submitQuiz(req, res) {
  const { classId, answers } = req.body;
  const userId = req.user.id;

  if (!classId || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'classId y answers son requeridos' });
  }

  const outcome = await withTransaction(async (client) => {
    const classResult = await client.query('SELECT * FROM classes WHERE id = $1', [classId]);
    if (classResult.rows.length === 0) {
      return { status: 404, body: { message: 'Clase no encontrada' } };
    }

    const classContent = Array.isArray(classResult.rows[0].content) ? classResult.rows[0].content : [];
    let score = 0;
    const total = answers.length;

    const graded = answers.map((a) => {
      const term = classContent.find((t) => t.spanish === a.spanish);
      const correct = Boolean(term) && matchesTranslation(term.english, a.answer);
      if (correct) {
        score += 1;
      }
      return { spanish: a.spanish, answer: a.answer, correct, expected: term?.english || '' };
    });

    const result = await client.query(
      'INSERT INTO quizzes (class_id, user_id, score, total, answers) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [classId, userId, score, total, JSON.stringify(graded)]
    );

    const passed = total > 0 && (score / total) >= 0.7;
    if (passed) {
      const progressResult = await client.query('SELECT * FROM progress WHERE user_id = $1 FOR UPDATE', [userId]);
      if (progressResult.rows.length === 0) {
        await client.query(
          'INSERT INTO progress (user_id, completed_classes, current_level, score) VALUES ($1, $2, $3, $4)',
          [userId, JSON.stringify([classId]), 'Beginner', score]
        );
      } else {
        const current = progressResult.rows[0];
        const completed = Array.isArray(current.completed_classes) ? current.completed_classes : [];
        if (!completed.includes(classId)) {
          completed.push(classId);
          await client.query(
            'UPDATE progress SET completed_classes = $1, score = score + $2 WHERE user_id = $3',
            [JSON.stringify(completed), score, userId]
          );
        }
      }
    }

    return {
      status: 200,
      body: {
        quizId: result.rows[0].id,
        score,
        total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        passed,
        answers: graded,
      },
    };
  });

  if (outcome.status !== 200) {
    return res.status(outcome.status).json(outcome.body);
  }

  return res.json(outcome.body);
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
  getClassesMeta,
  createClass,
  updateClass,
  deleteClass,
  getProgress,
  updateProgress,
  importClassesCsv,
  submitQuiz,
  getQuizHistory,
};
