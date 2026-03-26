const { query } = require('../utils/db');

async function dashboardStats(_req, res) {
  const usersResult = await query('SELECT role, active FROM users');
  const classesResult = await query('SELECT COUNT(*) FROM classes');
  const progressResult = await query('SELECT COUNT(*) FROM progress');

  const users = usersResult.rows;
  const activeStudents = users.filter((u) => u.role === 'student' && u.active).length;

  return res.json({
    totalUsers: users.length,
    totalAdmins: users.filter((u) => u.role === 'admin').length,
    totalStudents: users.filter((u) => u.role === 'student').length,
    activeStudents,
    totalClasses: parseInt(classesResult.rows[0].count, 10),
    progressRecords: parseInt(progressResult.rows[0].count, 10),
  });
}

module.exports = {
  dashboardStats,
};
