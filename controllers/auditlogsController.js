const pgDatabase = require("../database.js"); // Import PostgreSQL client

exports.getAuditLogs = async ({ page = 1, limit = 10 }) => {
  try {
    const offset = (page - 1) * limit;

    // Optional total count (for pagination)
    const countResult = await pgDatabase.query("SELECT COUNT(*) FROM audit_logs");
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT 
        al.log_id,
        al.user_id,
        u.first_name,
        u.last_name,
        al.action,
        al.details,
        al.timestamp
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ORDER BY al.timestamp DESC
      LIMIT $1 OFFSET $2
    `;

    const values = [limit, offset];
    const result = await pgDatabase.query(query, values);

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      logs: result.rows,
    };
  } catch (error) {
    console.error("❌ Error fetching audit logs:", error);
    throw error;
  }
};