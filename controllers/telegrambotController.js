const pgDatabase = require('../database.js'); // Import PostgreSQL client

exports.getTelegramUsers = async (chatID) => {
  try {
    // Query to get user details by chatID
    const query = 'SELECT * FROM TelegramBot WHERE chatID = $1';
    const values = [chatID];

    const result = await pgDatabase.query(query, values);

    // If no user is found, return null
    if (!result.rows.length) {
      return null;
    }

    // Return the user object
    return result.rows[0]; // Return the first (and only) row for the single user
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
