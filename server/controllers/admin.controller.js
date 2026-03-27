const { query } = require('../utils/db');

async function dashboardStats(_req, res) {
  const usersResult = await query(`
    SELECT
      COUNT(*)::int AS total_users,
      COUNT(*) FILTER (WHERE role = 'admin')::int AS total_admins,
      COUNT(*) FILTER (WHERE role = 'student')::int AS total_students,
      COUNT(*) FILTER (WHERE role = 'student' AND active = true)::int AS active_students
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
