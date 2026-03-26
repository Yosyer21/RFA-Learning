const { readJson } = require('../utils/db');

async function dashboardStats(_req, res) {
  const users = await readJson('users.json', []);
  const classes = await readJson('clases.json', []);
  const progress = await readJson('progress.json', []);

  const activeStudents = users.filter((user) => user.role === 'student' && user.active).length;

  return res.json({
    totalUsers: users.length,
    totalAdmins: users.filter((user) => user.role === 'admin').length,
    totalStudents: users.filter((user) => user.role === 'student').length,
    activeStudents,
    totalClasses: classes.length,
    progressRecords: progress.length,
  });
}

module.exports = {
  dashboardStats,
};
