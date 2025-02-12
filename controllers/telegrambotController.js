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

exports.insertTelegramUser = async (chatid, username, firstname, userData) => {
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
      userData[chatid].mentor_id,       // $4: mentor_id (UUID)
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

      // Here, store the evaluation in your database OR send it to the Telegram bot
      // Example: sendToTelegramBot(mentorName.full_name, seId, evaluationData);

      // // Insert the evaluation data into the database
    // await pgDatabase.query(
    //   `INSERT INTO evaluations (se_id, evaluator, evaluation_data) VALUES ($1, $2, $3)`,
    //   [seId, evaluator, JSON.stringify(evaluations)]
    // );

    // console.log("✅ Evaluation successfully stored in database");

    // // Fetch mentor assigned to this SE
    // const mentorResult = await pgDatabase.query(
    //   `SELECT m.mentor_id, m.mentor_firstName, m.mentor_lastName, u.telegramChatId
    //    FROM mentors m
    //    JOIN users u ON m.mentor_id = u.id
    //    WHERE m.mentor_id = (SELECT mentor_id FROM social_enterprises WHERE se_id = $1)`,
    //   [seId]
    // );

    // if (mentorResult.rows.length === 0) {
    //   console.log("⚠️ No mentor found for this SE.");
    //   return res.status(404).json({ error: "No mentor found." });
    // }

    // const { mentor_firstName, mentor_lastName, telegramChatId } = mentorResult.rows[0];

    // if (!telegramChatId) {
    //   console.log("⚠️ Mentor does not have a Telegram chat ID linked.");
    //   return res.status(400).json({ error: "Mentor has not linked their Telegram account." });
    // }

    // // Construct the evaluation summary message
    // let message = `📢 *New Evaluation Received*\n\n`;
    // message += `👤 *Evaluator*: ${evaluator}\n`;
    // message += `📌 *Social Enterprise*: ${seId}\n\n`;

    // Object.keys(evaluations).forEach((category) => {
    //   const { rating, selectedCriteria, comments } = evaluations[category];
    //   message += `📝 *${category}*: ${"⭐".repeat(rating)} (${rating}/5)\n`;
    //   message += `📌 *Key Points*:\n${selectedCriteria.map((c) => `- ${c}`).join("\n")}\n`;
    //   if (comments) {
    //     message += `💬 *Additional Comments*: ${comments}\n`;
    //   }
    //   message += `\n`;
    // });

    // // Send evaluation summary to the mentor on Telegram
    // const response = await sendMessage(telegramChatId, message);

    // console.log("✅ Message successfully sent to Telegram:", response);
    // res.json({ success: true, message: "Evaluation submitted and mentor notified." });
