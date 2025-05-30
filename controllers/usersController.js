const pgDatabase = require("../database.js"); // Import PostgreSQL client

exports.getUsers = async () => {
  try {
    const res = await pgDatabase.query('SELECT * FROM users');
    
    if (!res.rows || res.rows.length === 0) {
      console.error("No users found");
      return null; // or return an empty array []
    }

    return res.rows; // return the list of users
  } catch (error) {
    console.error("Error fetching user:", error);
    return null; // or handle error more gracefully
  }
};

exports.getUserName = async (user_id) => {
  try {
    console.log(`Fetching user by ID: ${user_id}`);

    const query = ` SELECT CONCAT(first_name, ' ', last_name) AS full_name 
                    FROM users 
                    WHERE user_id = $1`;
    const values = [user_id];

    const result = await pgDatabase.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error fetching mentor by ID:", error);
    return null;
  }
};