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

exports.insertTelegramUser = async (chatid, username, firstname, userData, mentorID) => {
  try {
    // SQL query to insert data into telegrambot table
    const query = `
      INSERT INTO "telegrambot" (
        "username", "firstName", "lastName", "mentor_id", "rating", "comments", "isAcknowledge", "se_ID", "chatid"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *; -- Return the inserted row
    `;

    // Extract the values from the userData object
    const values = [
      username,                         // $1: username
      firstname,                        // $2: firstName
      '',                               // $3: lastName (optional, default to empty string)
      mentorID,       // $4: mentor_id (UUID)
      null,                             // $5: rating (default to null)
      null,                             // $6: comments (default to null)
      false,                            // $7: isAcknowledge (default to false)
      userData[chatid].se_id,           // $8: se_ID (UUID)
      chatid                            // $9: chatid (Primary Key)
    ];

    // Execute the query
    const result = await pgDatabase.query(query, values);

    // Log the inserted row
    console.log("✅ User inserted successfully:", result.rows[0]);

    // Return the inserted row
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error inserting user:", error);
    throw error; // Propagate error for further handling
  }
};
