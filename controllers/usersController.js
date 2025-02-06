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