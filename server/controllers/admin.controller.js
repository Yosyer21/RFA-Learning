const { query } = require('../utils/db');
const { hasGoogleSheetsConfig, loadPaidRegistrationAccounts } = require('../utils/registration-eligibility');

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

async function paidAccounts(_req, res) {
  if (!hasGoogleSheetsConfig()) {
    return res.json({
      configured: false,
      totalOrders: 0,
      totalPeople: 0,
      lastPaidAt: '',
      accounts: []
    });
  }

  const accounts = await loadPaidRegistrationAccounts();
  const totalOrders = accounts.length;
  const totalPeople = accounts.length;
  const lastPaidAt = accounts.find((account) => account.paidAt || account.createdAt)?.paidAt || accounts.find((account) => account.createdAt)?.createdAt || '';

  return res.json({
    configured: true,
    totalOrders,
    totalPeople,
    lastPaidAt,
    accounts,
  });
}

module.exports = {
  dashboardStats,
  paidAccounts,
};
