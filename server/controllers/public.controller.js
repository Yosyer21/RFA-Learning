const { query } = require('../utils/db');

// ── Streak calculation (consecutive days with quiz activity) ──
function calculateStreak(quizzes) {
  if (!Array.isArray(quizzes) || quizzes.length === 0) return 0;

  const dates = new Set();
  quizzes.forEach((q) => {
    const d = new Date(q.completedAt);
    if (!Number.isNaN(d.getTime())) {
      dates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  });

  const uniqueDates = Array.from(dates).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ── Public profile (no auth required) ──
// Devuelve SOLO datos públicos del usuario. Nunca expone email, contraseña,
// must_change_password, active ni el historial detallado de respuestas.
async function getPublicProfile(req, res) {
  const username = String(req.params.username || '').trim().toLowerCase();
  if (!username) {
    return res.status(400).json({ message: 'Usuario requerido' });
  }

  // 1. Usuario (solo campos públicos)
  const userResult = await query(
    `SELECT id, name, username, role, bio, avatar_color, avatar_url, created_at
     FROM users WHERE LOWER(username) = $1`,
    [username]
  );
  const user = userResult.rows[0];
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  // 2. Progreso
  const progressResult = await query(
    'SELECT completed_classes AS "completedClasses", current_level AS "currentLevel", score FROM progress WHERE user_id = $1',
    [user.id]
  );
  const progress = progressResult.rows[0] || { completedClasses: [], currentLevel: 'Beginner', score: 0 };
  const completedIds = Array.isArray(progress.completedClasses) ? progress.completedClasses : [];

  // 3. Todas las clases (para progreso por nivel)
  const classesResult = await query('SELECT id, level FROM classes ORDER BY id');
  const allClasses = classesResult.rows;

  // 4. Quiz stats (agregadas, sin respuestas)
  const quizStatsResult = await query(
    `SELECT COUNT(*) AS total_quizzes, COALESCE(SUM(score), 0) AS total_score, COALESCE(SUM(total), 0) AS total_questions
     FROM quizzes WHERE user_id = $1`,
    [user.id]
  );
  const quizStats = quizStatsResult.rows[0] || { total_quizzes: 0, total_score: 0, total_questions: 0 };
  const totalQuizzes = parseInt(quizStats.total_quizzes) || 0;
  const totalScore = parseInt(quizStats.total_score) || 0;
  const totalQuestions = parseInt(quizStats.total_questions) || 0;
  const accuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  // 5. Fechas de quizzes para racha
  const quizDatesResult = await query(
    'SELECT completed_at AS "completedAt" FROM quizzes WHERE user_id = $1',
    [user.id]
  );
  const streak = calculateStreak(quizDatesResult.rows);

  // 6. Logros desbloqueados (misma lógica que getHomeData)
  const achievements = [];
  if (completedIds.length >= 1) achievements.push({ id: 'first_class', icon: 'FC', titleEs: 'Primera clase', titleEn: 'First Class', descEs: 'Completaste tu primera clase', descEn: 'You completed your first class' });
  if (completedIds.length >= 5) achievements.push({ id: 'five_classes', icon: '5C', titleEs: 'Estrella del aprendizaje', titleEn: 'Learning Star', descEs: 'Completaste 5 clases', descEn: 'You completed 5 classes' });
  if (completedIds.length >= 10) achievements.push({ id: 'ten_classes', icon: '10', titleEs: 'Campeón', titleEn: 'Champion', descEs: 'Completaste 10 clases', descEn: 'You completed 10 classes' });
  if (totalQuizzes >= 1) achievements.push({ id: 'first_quiz', icon: 'QZ', titleEs: 'Primer quiz', titleEn: 'First Quiz', descEs: 'Realizaste tu primer quiz', descEn: 'You took your first quiz' });
  if (accuracy >= 90 && totalQuizzes >= 3) achievements.push({ id: 'accuracy_master', icon: 'AC', titleEs: 'Precisión letal', titleEn: 'Deadly Accuracy', descEs: `${accuracy}% de precisión en quizzes`, descEn: `${accuracy}% accuracy on quizzes` });
  if (streak >= 3) achievements.push({ id: 'streak_3', icon: 'S3', titleEs: 'Racha de 3', titleEn: 'Streak of 3', descEs: 'Mantén una racha de 3 días', descEn: 'Keep a 3-day streak' });
  if (streak >= 7) achievements.push({ id: 'streak_7', icon: 'S7', titleEs: 'Racha semanal', titleEn: 'Weekly Streak', descEs: 'Mantén una racha de 7 días', descEn: 'Keep a 7-day streak' });

  // 7. Progreso por nivel
  const levelClasses = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  const levelCompleted = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  allClasses.forEach((c) => {
    if (levelClasses[c.level] !== undefined) levelClasses[c.level]++;
    if (levelClasses[c.level] !== undefined && completedIds.includes(c.id)) levelCompleted[c.level]++;
  });

  const levelProgress = Object.keys(levelClasses).map((level) => ({
    level,
    total: levelClasses[level],
    completed: levelCompleted[level],
    percentage: levelClasses[level] > 0 ? Math.round((levelCompleted[level] / levelClasses[level]) * 100) : 0,
  }));

  return res.json({
    user: {
      name: user.name,
      username: user.username,
      role: user.role,
      bio: user.bio || '',
      avatarColor: user.avatar_color || '#6c5ce7',
      avatarUrl: user.avatar_url || '',
      createdAt: user.created_at,
    },
    stats: {
      completedClasses: completedIds.length,
      totalQuizzes,
      accuracy,
      streak,
      score: progress.score || 0,
      currentLevel: progress.currentLevel || 'Beginner',
    },
    achievements,
    levelProgress,
  });
}

module.exports = {
  getPublicProfile,
};
