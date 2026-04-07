const { query } = require('../utils/db');

async function dashboardStats(_req, res) {
  const usersResult = await query(`
    SELECT
      COUNT(*)::int AS total_users,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END)::int AS total_admins,
      SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END)::int AS total_students,
      SUM(CASE WHEN role = 'student' AND active = true THEN 1 ELSE 0 END)::int AS active_students
    FROM users
  `);
  const classesResult = await query('SELECT COUNT(*)::int AS count FROM classes');
  const progressResult = await query('SELECT COUNT(*)::int AS count FROM progress');
  const stats = usersResult.rows[0];

  return res.json({
    totalUsers: stats.total_users,
    totalAdmins: stats.total_admins,
    totalStudents: stats.total_students,
    activeStudents: stats.active_students,
    totalClasses: classesResult.rows[0].count,
    progressRecords: progressResult.rows[0].count,
  });
}

module.exports = {
  dashboardStats,
};
