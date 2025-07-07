const pgDatabase = require('../database.js'); // Import PostgreSQL client


exports.getTelegramUsers = async (chatID) => {
  try {
    // Query to get user details by chatID
    const query = 'SELECT * FROM telegrambot WHERE chatid = $1';
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

exports.countTelegramUsers = async (se_id) => {
  try {
    const query = `
      SELECT COUNT(*) AS total_users
      FROM telegrambot tu
      WHERE tu.se_id = $1;
    `;
    const values = [se_id];

    const result = await pgDatabase.query(query, values);

    return result.rows; 
  } catch (error) {
    console.error("Error fetching count:", error);
    return null;
  }
};

exports.insertTelegramUser = async (chatid, username, firstname, userData, mentorID) => {
  try {
    // SQL query to insert data into telegrambot table
    const query = `
      INSERT INTO "telegrambot" (
        "username", "firstName", "lastName", "mentor_id", "rating", "comments", "isAcknowledge", "se_id", "chatid"
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

exports.getSocialEnterprisesUsersByProgram = async (program_id) => {
  try {
    console.log("🔍 Querying chat IDs for programs:", program_id);

    const query = `
      SELECT DISTINCT t.chatid, t.se_id
      FROM telegrambot t
      JOIN socialenterprises se ON t.se_id = se.se_id
      WHERE se.program_id = ANY($1::uuid[])
    `;
    
    const { rows } = await pgDatabase.query(query, [program_id]);

    console.log("📌 Query result:", rows); // Debugging output

    // Ensure chat IDs are valid before returning
    const chatIds = rows.map(row => ({
      chatId: row.chatid,
      seId: row.se_id, // Capture the SE ID as well
    }));

    console.log("✅ Returning Chat IDs with SE ID:", chatIds);
    return chatIds;
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return []; // Return an empty array instead of null
  }
};

exports.checkTelegramBotTable = async (mentorID, seID) => {
  try {
    const query = `
      SELECT 1 FROM "telegrambot"
      WHERE "mentor_id" = $1 AND "se_id" = $2
      LIMIT 1;
    `;

    const result = await pgDatabase.query(query, [mentorID, seID]);

    // ✅ If any row is found, exists = true
    return result.rows.length > 0;
  } catch (error) {
    console.error("❌ Error checking telegrambot table:", error);
    throw error;
  }
};