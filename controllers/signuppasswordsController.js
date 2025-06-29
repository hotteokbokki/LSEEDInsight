const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getSignUpPassword = async () => {
  try {
    const query = `
      SELECT password
      FROM signup_passwords
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const result = await pgDatabase.query(query);

    if (!result.rows.length) {
      return null; // Return null if no password found
    }

    // Return the password value directly
    return result.rows[0].password;
  } catch (error) {
    console.error("❌ Error fetching signup password:", error);
    return null;
  }
};