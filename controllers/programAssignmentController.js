const pgDatabase = require("../database.js"); // Import PostgreSQL client

exports.getProgramCoordinators = async () => {
  try {
    const query = `
        SELECT 
            p.program_id,
            p.name AS program_name,
            p.description,
            u.user_id AS coordinator_id,
            CONCAT(u.first_name, ' ', u.last_name) AS program_coordinator,
            u.email AS coordinator_email
        FROM 
            programs p
        LEFT JOIN 
            program_assignment pa ON p.program_id = pa.program_id
        LEFT JOIN 
            users u ON pa.user_id = u.user_id AND u.roles = 'LSEED-Coordinator';
    `;
    const result = await pgDatabase.query(query);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows; // ✅ Return all rows
  } catch (error) {
    console.error("Error fetching program coordinators:", error);
    return null;
  }
};

exports.getProgramAssignment = async (user_id) => {
  try {
    const query = `
      SELECT p.name FROM program_assignment AS pa
      JOIN users AS u ON u.user_id = pa.user_id
      JOIN programs AS p ON pa.program_id = p.program_id
      WHERE pa.user_id = $1;
    `;
    const result = await pgDatabase.query(query, [user_id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows;
  } catch (error) {
    console.error("Error fetching program coordinators:", error);
    return null;
  }
};