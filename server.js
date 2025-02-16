const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { router: authRoutes, requireAuth } = require("./routes/authRoutes");
const axios = require("axios");
const ngrok = require("ngrok"); // Exposes your local server to the internet
const { getPrograms, getProgramNameByID } = require("./controllers/programsController");
const { getTelegramUsers, insertTelegramUser } = require("./controllers/telegrambotController");
const { getSocialEnterprisesByProgram, getSocialEnterpriseByID, getAllSocialEnterprises } = require("./controllers/socialenterprisesController");
require("dotenv").config();
const { getUsers, getUserName } = require("./controllers/usersController");
const pgDatabase = require("./database.js"); // Import PostgreSQL client
const cookieParser = require("cookie-parser");
const { getMentorsBySocialEnterprises, getMentorById } = require("./controllers/mentorsController.js");
const { getAllSDG } = require("./controllers/sdgController.js");

const app = express();

// Enable CORS with credentials
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Configure session handling
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use a secure key
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Use HTTPS in production
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Use authentication routes
app.use("/auth", authRoutes);

// Temporary storage for user states
const userStates = {};
// Timeout duration (in milliseconds) before clearing stale states
const STATE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const PASSWORD = 'q@P#3_4)V5vUw+LJ!F'; // Set a secure password for authentication
const userSelections = {}; // Store selections temporarily before final save

// Helper function to send messages
async function sendMessage(chatId, message) {
  try {
      const response = await axios.post(TELEGRAM_API_URL, {
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown' // Optional: If you want Markdown formatting in your messages
      });
      return response.data;
  } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
  }
}

// Helper function to send messages with inline keyboard
async function sendMessageWithInlineKeyboard(chatId, message, options) {
  try {
    const inlineKeyboard = options.map(option => [option]);// Convert to 2D array inside the function
    console.log("Inline Keyboard:", inlineKeyboard); // Debugging log

      const response = await axios.post(TELEGRAM_API_URL, {
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: {
              inline_keyboard: inlineKeyboard,
          },
      });
      return response.data;
  } catch (error) {
    console.error("Failed to send message with inline keyboard:", error.response?.data || error.message);
  }
}

async function deleteMessage(chatId, messageId) {
  try {
    // Make a POST request to the Telegram Bot API to delete the message
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
      {
        chat_id: chatId,
        message_id: messageId,
      }
    );

    // Check if the deletion was successful
    if (response.data && response.data.ok) {
      console.log(`✅ Message ${messageId} deleted successfully from chat ${chatId}`);
    } else {
      console.error(`❌ Failed to delete message ${messageId}:`, response.data);
      throw new Error(`Failed to delete message: ${response.data.description}`);
    }
  } catch (error) {
    // Handle errors (e.g., message not found, bot lacks permissions)
    console.error(`❌ Error deleting message ${messageId} in chat ${chatId}:`, error.message);
    throw error; // Re-throw the error for upstream handling
  }
}

async function sendMessageWithOptions(chatId, message, options) {
  try {
    console.log("Inline Keyboard:", options); // Debugging log

    const response = await axios.post(TELEGRAM_API_URL, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: options, // Use directly without additional mapping
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send message with inline keyboard:", error.response?.data || error.message);
  }
}

app.get("/getSDGs", async (req, res) => {
  try {
    const result = await getAllSDG();
    res.json(result); // Send sdg as JSON
  } catch (error) {
    console.error("Error fetching sdgs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentors", async (req, res) => {
  try {
    const result = await pgDatabase.query("SELECT * FROM mentors");
    res.json(result.rows); // Send mentors as JSON
  } catch (error) {
    console.error("Error fetching mentors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/mentors", async (req, res) => {
  try {
    const { mentor_id, mentor_firstName, mentor_lastName, email, contactNum } = req.body;

    await pgDatabase.query(
      `INSERT INTO mentors ("mentor_id", "mentor_firstName", "mentor_lastName", "email", "contactNum", "number_SE_assigned") 
       VALUES ($1, $2, $3, $4, $5, 0)`,
      [mentor_id, mentor_firstName, mentor_lastName, email, contactNum]
    );

    res.status(201).json({ message: "Mentor added successfully" });
  } catch (error) {
    console.error("Error adding mentor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/api/mentors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { mentor_firstName, mentor_lastName, email, contactNum, number_SE_assigned } = req.body;

    const result = await pgDatabase.query(
      `UPDATE mentors 
       SET "mentor_firstName" = $1, "mentor_lastName" = $2, "email" = $3, "contactNum" = $4, "number_SE_assigned" = $5
       WHERE "mentor_id" = $6`,
      [mentor_firstName, mentor_lastName, email, contactNum, number_SE_assigned, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json({ message: "Mentor updated successfully" });
  } catch (error) {
    console.error("Error updating mentor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//API for evaluation

app.post("/evaluate", async (req, res) => {
  try {
    console.log("📥 Received Evaluation Data:", req.body);

    let { mentorId, se_id, sdg_id, evaluations } = req.body;

    if (!Array.isArray(se_id)) se_id = [se_id];
    if (!Array.isArray(sdg_id)) sdg_id = sdg_id ? [sdg_id] : [];

    console.log("🔹 Converted se_id:", se_id);
    console.log("🔹 Converted sdg_id:", sdg_id);

    const formattedSdgId = `{${sdg_id.join(",")}}`;

    console.log("📤 Formatted sdg_id:", formattedSdgId);

    const defaultEvaluation = { rating: 1, selectedCriteria: [], comments: "" };

    const categories = [
      "teamwork",
      "financialPlanning",
      "marketingPlan",
      "productServiceDesign",
      "humanResourceManagement",
      "logistics",
    ];

    let insertedEvaluations = [];

    for (let singleSeId of se_id) {
      const formattedSeId = `{${singleSeId}}`;

      console.log(`📤 Processing SE: ${singleSeId}`);

      const values = [mentorId, formattedSeId, formattedSdgId];

      categories.forEach((category) => {
        const evalData = evaluations[category] || defaultEvaluation;
        values.push(evalData.rating, evalData.selectedCriteria, evalData.comments || "");
      });

      console.log("📊 Query Values for SE:", singleSeId, values);

      const query = `
        INSERT INTO evaluation (
          mentor_id, se_id, sdg_id,
          teamwork_rating, teamwork_selectedcriteria, teamwork_addtlcmt,
          finance_rating, finance_selectedcriteria, finance_addtlcmt,
          marketing_rating, marketing_selectedcriteria, marketing_addtlcmt,
          productservice_rating, productservice_selectedcriteria, productservice_addtlcmt,
          humanresource_rating, humanresource_selectedcriteria, humanresource_addtlcmt,
          logistics_rating, logistics_selectedcriteria, logistics_addtlcmt
        ) VALUES (
          $1, $2, $3, 
          $4, $5, $6, 
          $7, $8, $9, 
          $10, $11, $12, 
          $13, $14, $15, 
          $16, $17, $18, 
          $19, $20, $21
        ) RETURNING *;
      `;

      const result = await pgDatabase.query(query, values);
      console.log(`✅ Successfully inserted evaluation for SE: ${singleSeId}`);
      insertedEvaluations.push(result.rows[0]);

      // ✅ Step 1: Get chat ID of mentor
      const chatIdQuery = `
        SELECT chatid FROM telegrambot
        WHERE mentor_id = $1 AND "se_ID" = $2
      `;
      const chatIdResult = await pgDatabase.query(chatIdQuery, [mentorId, singleSeId]);

      if (chatIdResult.rows.length === 0) {
        console.warn(`⚠️ No chat ID found for mentor ${mentorId} and SE ${singleSeId}`);
        continue;
      }
      
      const mentor = await getMentorById(mentorId);
      const socialEnterprise = await getSocialEnterpriseByID(singleSeId);
      
      for (const row of chatIdResult.rows) {
        const chatId = row.chatid;
        console.log(`📩 Sending evaluation message to chat ID: ${chatId}`);
      
        let message = `📢 *New Evaluation Received*\n\n`;
        message += `👤 *Mentor:* ${mentor.mentor_firstName} ${mentor.mentor_lastName}\n`;
        message += `🏢 *Social Enterprise:* ${socialEnterprise.team_name}\n\n`;
      
        categories.forEach((category) => {
          const evalData = evaluations[category] || defaultEvaluation;
          message += `📝 *${category.replace(/([A-Z])/g, " $1")}:* ${"⭐".repeat(evalData.rating)} (${evalData.rating}/5)\n`;
          message += `📌 *Key Points:*\n${evalData.selectedCriteria.map(c => `- ${c}`).join("\n")}\n`;
          if (evalData.comments) {
            message += `💬 *Comments:* ${evalData.comments}\n`;
          }
          message += `\n`;
        });
      
        await sendMessage(chatId, message);
      }
    }

    res.status(201).json({
      message: "Evaluations added successfully",
      evaluations: insertedEvaluations,
    });

  } catch (error) {
    console.error("❌ INTERNAL SERVER ERROR:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// Example of a protected route
app.get("/protected", requireAuth, (req, res) => {
  res.json({ message: "Access granted to protected route" });
});

app.get("/getSocialEnterprises", async (req, res) => {
  try {
    const SE = await getAllSocialEnterprises(); // Fetch SEs from DB
    if (!SE || SE.length === 0) {
      return res.status(404).json({ message: "No social enterprises found" });
    }
    res.json(SE); // Send SE data
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getPrograms", async (req, res) => {
  try {
    const result = await pgDatabase.query("SELECT program_id, name FROM Programs");

    if (!result.rows || result.rows.length === 0) {
      return res.json([]); // ✅ Always return an array
    }

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching programs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/webhook", async (req, res) => {
  const message = req.body.message || req.body.edited_message;
  const callbackQuery = req.body.callback_query;

  // Helper function to set or reset the user state with a timeout
  const setUserState = (chatId, state) => {
    if (userStates[chatId]?.timeoutId) {
      clearTimeout(userStates[chatId].timeoutId);
    }
    userStates[chatId] = { state };
    userStates[chatId].timeoutId = setTimeout(() => {
      console.log(`🧹 State cleared for user ${chatId} due to inactivity.`);
      delete userStates[chatId];
    }, STATE_TIMEOUT);
  };

  // Handle text messages (Registration, Password Check)
  if (message) {
    const chatId = message.chat.id;
    const userName = message.chat.username || "Unknown User";
    const firstName = message.chat.first_name || "No First Name";
    const lastName = message.chat.last_name || "No Last Name";

    try {
      // Fetch user and programs in parallel
      const [existingUser, options] = await Promise.all([
        getTelegramUsers(chatId),
        getPrograms(),
      ]);

      // If user already exists, prevent re-registration
      if (existingUser) {
        if (message.text === "/start") {
          await sendMessage(
            chatId,
            "✅ You are already registered! No need to enter the password again."
          );
        } else {
          await sendMessage(
            chatId,
            "⚠️ You are already registered. Please use /start to begin a new interaction."
          );
        }
        return res.sendStatus(200); // No need to proceed further if user is registered
      }

      // Enforce /start as the first interaction
      if (!userStates[chatId] && message.text !== "/start") {
        await sendMessage(
          chatId,
          "⚠️ Please start the conversation by sending /start."
        );
        return res.sendStatus(200);
      }

      // If unregistered user sends /start, ask for the password
      if (message.text === "/start") {
        setUserState(chatId, "awaiting_password"); // Set state to awaiting password
        await sendMessage(
          chatId,
          "🔑 Please enter the password to register and continue interacting with the bot."
        );
        return res.sendStatus(200);
      }

      // If user enters password and options are available
      if (
        userStates[chatId]?.state === "awaiting_password" &&
        message.text.trim().toLowerCase() === PASSWORD.toLowerCase()
      ) {
        setUserState(chatId, "awaiting_program_selection"); // Transition to program selection
        if (options.length === 0) {
          await sendMessage(
            chatId,
            "⚠️ No programs available at the moment. Please try again later."
          );
          delete userStates[chatId]; // Reset state if no programs are available
          return res.sendStatus(200);
        }
        await sendMessageWithInlineKeyboard(
          chatId,
          "✅ Password correct! You have been successfully registered.\n\nPlease choose your program:",
          options
        );
        return res.sendStatus(200);
      }

      // If password is incorrect
      if (userStates[chatId]?.state === "awaiting_password") {
        await sendMessage(chatId, "❌ Incorrect password. Please try again.");
        return res.sendStatus(200);
      }

      // Handle invalid input during program selection
      if (userStates[chatId]?.state === "awaiting_program_selection") {
        await sendMessage(
          chatId,
          "⚠️ Please select a program from the provided options."
        );
        return res.sendStatus(200);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      return res.sendStatus(500); // Internal server error in case of failure
    }
  }

  // Handle callback queries (Program, Social Enterprise, Mentor Selection)
  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userName = callbackQuery.message.chat.username;
    const firstName = callbackQuery.message.chat.first_name;
    const callbackQueryId = callbackQuery.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    // Check if the callbackQueryId is valid
    if (!callbackQueryId || !data) {
      console.error("Invalid or expired callback query received.");
      return res.sendStatus(400); // Bad request if the query is invalid
    }

    try {
      if (data.startsWith("program_")) {
        const programId = data.replace("program_", "");
        const selectedProgram = await getProgramNameByID(programId);
        if (!selectedProgram) {
          return res.sendStatus(400); // Invalid selection
        }

        // Acknowledge the callback query immediately
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          callback_query_id: callbackQueryId,
          text: "✅ Choice received!",
          show_alert: false,
        });

        const socialEnterprises = await getSocialEnterprisesByProgram(programId);
        if (socialEnterprises.length === 0) {
          await sendMessage(chatId, `⚠️ No social enterprises available under *${selectedProgram}*.`);
          return res.sendStatus(200);
        }

        // Map the data correctly
        const enterpriseOptions = socialEnterprises.map((se) => ({
          text: se.text.replace(" - ", "\n"), // Break at " - " for better readability
          callback_data: se.callback_data,
        }));

        // Wrap in a 2D array (Telegram requires this)
        const inlineKeyboard = enterpriseOptions.map((option) => [option]);

        // Send the SE options message and store its ID
        const seOptionsMessage = await sendMessageWithOptions(
          chatId,
          `✅ You selected *${selectedProgram}*!\n\nPlease choose a social enterprise:`,
          inlineKeyboard
        );

        // Store the SE options message ID for deletion later
        userStates[chatId].seOptionsMessageId = seOptionsMessage.message_id;

        return res.sendStatus(200);
      } else if (data.startsWith("enterprise_")) {
        const enterpriseId = data.replace("enterprise_", "");
        const selectedEnterprise = await getSocialEnterpriseByID(enterpriseId);
        if (!selectedEnterprise) {
          return res.sendStatus(400); // Invalid selection
        }

        // Store the SE selection temporarily
        userSelections[chatId] = {
          se_id: selectedEnterprise.se_id,
          se_name: selectedEnterprise.team_name,
        };

        // Acknowledge the callback query immediately
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          callback_query_id: callbackQueryId,
          text: "✅ Choice received!",
          show_alert: false,
        });

        // Prompt confirmation before proceeding
        const inlineKeyboard = [
          [{ text: "Confirm", callback_data: `confirm_${enterpriseId}` }],
          [{ text: "Pick Again", callback_data: "pick_again" }],
        ];

        // Send the confirmation message and store its ID
        const confirmationMessage = await sendMessageWithOptions(
          chatId,
          `✅ You selected *${selectedEnterprise.team_name}*!\n\nPlease confirm your selection:`,
          inlineKeyboard
        );

        // Store the confirmation message ID for deletion later
        userStates[chatId].confirmationMessageId = confirmationMessage.message_id;

        return res.sendStatus(200);
      } else if (data.startsWith("confirm_")) {
        const enterpriseId = data.replace("confirm_", "");
        const selectedEnterprise = await getSocialEnterpriseByID(enterpriseId);
        if (!selectedEnterprise) {
          return res.sendStatus(400); // Invalid selection
        }

        // Delete the SE options message
        if (userStates[chatId]?.seOptionsMessageId) {
          await deleteMessage(chatId, userStates[chatId].seOptionsMessageId);
          delete userStates[chatId].seOptionsMessageId;
        }

        // Delete the confirmation message
        if (userStates[chatId]?.confirmationMessageId) {
          await deleteMessage(chatId, userStates[chatId].confirmationMessageId);
          delete userStates[chatId].confirmationMessageId;
        }

        // Fetch mentors for the selected SE
        const mentors = await getMentorsBySocialEnterprises(enterpriseId);

        // Access the first mentor's name and ID
        const mentorName = mentors[0]?.name;
        const mentorID = mentors[0]?.mentor_id;

        if (mentors.length === 0) {
          await sendMessage(chatId, `⚠️ No mentors available under *${selectedEnterprise.team_name}*.`);
          return res.sendStatus(200);
        }

        // Ensure SE data is already stored
        if (!userSelections[chatId]) {
          console.error("❌ No SE selection found for user:", chatId);
          return res.sendStatus(400);
        }

        // Final confirmation message with the automatically assigned mentor
        await sendMessage(
          chatId,
          `✅ You are now registered under *${userSelections[chatId].se_name}* with Mentor *${mentorName}*.\n\nWelcome to LSEED Insight!`
        );

        // Insert into Database
        await insertTelegramUser(chatId, userName, firstName, userSelections, mentorID);
        delete userSelections[chatId];
        delete userStates[chatId]; // Clear user state after successful registration
        console.log(`🗑️ Cleared stored selections and state for user ${chatId}`);
        return res.sendStatus(200);
      } else if (data === "pick_again") {
        // Delete the confirmation message
        if (userStates[chatId]?.confirmationMessageId) {
          await deleteMessage(chatId, userStates[chatId].confirmationMessageId);
          delete userStates[chatId].confirmationMessageId;
        }

        // Reset selections and restart the process
        delete userSelections[chatId];
        setUserState(chatId, "awaiting_program_selection"); // Restart from program selection

        // Send "Selection cleared" message and store its ID
        const selectionClearedMessage = await sendMessage(
          chatId,
          "🔄 Selection cleared. Please choose your program again."
        );

        // Store the selection cleared message ID for deletion later
        userStates[chatId].selectionClearedMessageId = selectionClearedMessage.message_id;

        return res.sendStatus(200);
      }
    } catch (error) {
      console.error("Error processing callback query:", error);
      return res.sendStatus(500); // Internal server error if callback fails
    }
  }
});

async function deleteMessage(chatId, messageId) {
  try {
    // Make a POST request to the Telegram Bot API to delete the message
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
      {
        chat_id: chatId,
        message_id: messageId,
      }
    );

    // Check if the deletion was successful
    if (response.data && response.data.ok) {
      console.log(`✅ Message ${messageId} deleted successfully from chat ${chatId}`);
    } else {
      console.error(`❌ Failed to delete message ${messageId}:`, response.data);
      throw new Error(`Failed to delete message: ${response.data.description}`);
    }
  } catch (error) {
    // Handle errors (e.g., message not found, bot lacks permissions)
    console.error(`❌ Error deleting message ${messageId} in chat ${chatId}:`, error.message);
    throw error; // Re-throw the error for upstream handling
  }
}

// Send Message to a User (using stored Telegram User ID)
app.post("/send-message", async (req, res) => {
  try {
    console.log(`🔍 Fetching user details for: ${email}`);

    // Query PostgreSQL for user details
    const query = 'SELECT * FROM "Users" WHERE email = $1';
    const values = [email];
    
    const result = await pgDatabase.query(query, values);

    if (result.rows.length === 0) {
      console.log(`⚠️ No user found for email: ${email}`);
      return res.status(404).json({ error: "User not found." });
    }

    const user = result.rows[0];

    console.log("✅ User found:", user);

    // Extract user details
    const { first_name, last_name, telegramChatId } = user;

    console.log(`📌 User Details:
      - First Name: ${first_name}
      - Last Name: ${last_name}
      - Email: ${email}
      - Telegram Chat ID: ${telegramChatId}
    `);

    if (!telegramChatId) {
      console.log("⚠️ User does not have a Telegram chat ID linked.");
      return res.status(400).json({ error: "User has not linked their Telegram account." });
    }

    const message = `
    *📢 Mentor Feedback Notification*

    🌟 *Mentor Feedback Summary*
    - **Mentor**: John Doe
    - **Rating**: ⭐⭐⭐⭐⭐ (5/5)
    - **Comments**:
    \`\`\`
    This mentor is fantastic! Keep up the great work.
    \`\`\`

    ✅ *Acknowledge Feedback*
    Please click the link below to acknowledge that you have received this feedback:

    [✅ Acknowledge Feedback](http://example.com/acknowledge)
    `;

    console.log(`🚀 Sending message to ${first_name} ${last_name} (${email}) on Telegram...`);

    const response = await sendMessage(telegramChatId, message);

    console.log("✅ Message sent successfully:", response);
    res.json({ success: true, response });
    
  } catch (error) {
    console.error("❌ Error in /send-feedback route:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/updateUserRole/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'admin' or 'user'

  try {
    // Update the user's role in the database
    const query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
    const values = [role, id];
    const result = await pgDatabase.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]); // Respond with updated user data
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.BACKEND_PORT;
// Start the server and ngrok tunnel
const NGROK_DOMAIN = process.env.NGROK_DOMAIN; // Your predefined ngrok domain

// Function to set the webhook
async function setWebhook(ngrokUrl) {
  const webhookUrl = `${ngrokUrl}/webhook`;

  try {
      const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
          url: webhookUrl,
      });

      if (response.data.ok) {
          console.log(`✅ Webhook successfully set to: ${webhookUrl}`);
      } else {
          console.log(`❌ Failed to set webhook:`, response.data);
      }
  } catch (error) {
      console.error(`❌ Error setting webhook: ${error.message}`);
  }
}

// Start the server and ngrok tunnel
app.listen(PORT, async () => {
  console.log(`🚀 Localhost running on: http://localhost:${PORT}`);

  try {
      const ngrokUrl = await ngrok.connect(PORT);
      console.log(`🌍 Ngrok tunnel running at: ${ngrokUrl}`);

      // Set the webhook automatically
      await setWebhook(ngrokUrl);
  } catch (error) {
      console.log(`❌ Couldn't tunnel ngrok: ${error.message}`);
  }
});
