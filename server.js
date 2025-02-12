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

// Store users who interacted with the bot
let users = {}; // Consider using MongoDB or another database for persistence
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

app.post("/api/evaluations", async (req, res) => {
  try {
    console.log("📥 Received Evaluation Data:", req.body);

    let {
      mentor_id,
      se_id,
      sdg_id, // ✅ This must be formatted correctly
      teamwork_rating,
      teamwork_selectedcriteria,
      teamwork_addtlcmt,
      finance_rating,
      finance_selectedcriteria,
      finance_addtlcmt,
      marketing_rating,
      marketing_selectedcriteria,
      marketing_addtlcmt,
      productservice_rating,
      productservice_selectedcriteria,
      productservice_addtlcmt,
      humanresource_rating,
      humanresource_selectedcriteria,
      humanresource_addtlcmt,
      logistics_rating,
      logistics_selectedcriteria,
      logistics_addtlcmt,
    } = req.body;

    // ✅ Ensure `se_id` is always an array
    if (!Array.isArray(se_id)) {
      console.warn("⚠️ se_id is not an array. Converting...");
      se_id = [se_id]; // Convert single value to an array
    }

    console.log("🔹 Converted se_id:", se_id);

    // ✅ Convert `se_id` and `sdg_id` to PostgreSQL array format
    const formattedSeId = `{${se_id.join(",")}}`;
    const formattedSdgId = `{${sdg_id.join(",")}}`; // Convert `sdg_id` array to PostgreSQL format

    console.log("📤 Formatted se_id:", formattedSeId);
    console.log("📤 Formatted sdg_id:", formattedSdgId);

    // ✅ Fix ratings (ensure they are between 1-5)
    const fixRating = (rating) => (rating >= 1 && rating <= 5 ? rating : 1);
    teamwork_rating = fixRating(teamwork_rating);
    finance_rating = fixRating(finance_rating);
    marketing_rating = fixRating(marketing_rating);
    productservice_rating = fixRating(productservice_rating);
    humanresource_rating = fixRating(humanresource_rating);
    logistics_rating = fixRating(logistics_rating);

    console.log("📊 Ratings after validation:", {
      teamwork_rating,
      finance_rating,
      marketing_rating,
      productservice_rating,
      humanresource_rating,
      logistics_rating,
    });

    // ✅ Insert evaluation (Ensure `se_id` and `sdg_id` are properly formatted)
    console.log("📤 Inserting data into evaluation table...");

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
      ) RETURNING *`;

    const values = [
      mentor_id, formattedSeId, formattedSdgId, // ✅ Ensure `se_id` & `sdg_id` are properly formatted
      teamwork_rating, teamwork_selectedcriteria, teamwork_addtlcmt,
      finance_rating, finance_selectedcriteria, finance_addtlcmt,
      marketing_rating, marketing_selectedcriteria, marketing_addtlcmt,
      productservice_rating, productservice_selectedcriteria, productservice_addtlcmt,
      humanresource_rating, humanresource_selectedcriteria, humanresource_addtlcmt,
      logistics_rating, logistics_selectedcriteria, logistics_addtlcmt
    ];

    console.log("📤 SQL Query:", query);
    console.log("📊 Query Values:", values);

    const result = await pgDatabase.query(query, values);
    console.log("✅ Successfully inserted evaluation:", result.rows[0]);
    res.status(201).json({ message: "Evaluation added successfully", evaluation: result.rows[0] });

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
          await sendMessage(chatId, "✅ You are already registered! No need to enter the password again.");
        }
        return res.sendStatus(200); // No need to proceed further if user is registered
      }

      // If unregistered user sends /start, ask for the password
      if (message.text === "/start") {
        await sendMessage(chatId, "🔑 Please enter the password to register and continue interacting with the bot.");
        return res.sendStatus(200);
      }

      // If user enters password and options are available
      if (message.text === PASSWORD) {
        if (options[0].length === 0) {
          await sendMessage(chatId, "⚠️ No programs available at the moment. Please try again later.");
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
      await sendMessage(chatId, "❌ Incorrect password. Please try again.");
      return res.sendStatus(200);

    } catch (error) {
      console.error("Error handling message:", error);
      return res.sendStatus(500); // Internal server error in case of failure
    }
  }

  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const userName = callbackQuery.message.chat.username;
    const firstName = callbackQuery.message.chat.first_name;
    const callbackQueryId = callbackQuery.id;
    const data = callbackQuery.data;

    // Check if the callbackQueryId is valid
    if (!callbackQueryId || !data) {
        console.error("Invalid or expired callback query received.");
        return res.sendStatus(400); // Bad request if the query is invalid
    }

    try {
        if (data.startsWith("program_")) {
            // Handle program selection as before
            const programId = data.replace("program_", "");
            const selectedProgram = await getProgramNameByID(programId);

            if (!selectedProgram) {
                return res.sendStatus(400); // Invalid selection
            }

            // Acknowledge the callback query immediately
            axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text: "✅ Choice received!",
                show_alert: false,
            }).catch(err => console.error("Failed to acknowledge callback:", err.response?.data || err.message));

            const socialEnterprises = await getSocialEnterprisesByProgram(programId);

            if (socialEnterprises.length === 0) {
                await sendMessage(chatId, `⚠️ No social enterprises available under *${selectedProgram}*.`);
                return res.sendStatus(200);
            }

            // Map the data correctly
            const enterpriseOptions = socialEnterprises.map(se => ({
                text: se.text.replace(" - ", "\n"), // Break at " - " for better readability
                callback_data: se.callback_data
            }));

            // Wrap in a 2D array (Telegram requires this)
            const inlineKeyboard = enterpriseOptions.map(option => [option]);

            await sendMessageWithOptions(
                chatId,
                `✅ You selected *${selectedProgram}*!\n\nPlease choose a social enterprise:`,
                inlineKeyboard
            );

            return res.sendStatus(200);
          } else if (data.startsWith("enterprise_")) {
            const enterpriseId = data.replace("enterprise_", "");
            const selectedEnterprise = await getSocialEnterpriseByID(enterpriseId);
        
            console.log(`🔍 Selected Enterprise:`, selectedEnterprise);
        
            if (!selectedEnterprise) {
                return res.sendStatus(400); // Invalid selection
            }
        
            // Store the SE selection temporarily
            userSelections[chatId] = {
                se_id: selectedEnterprise.se_id,
                se_name: selectedEnterprise.team_name
            };
        
            console.log(`✅ Stored SE selection for user ${chatId}:`, userSelections[chatId]);
        
            // Acknowledge the callback query immediately
            axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text: "✅ Choice received!",
                show_alert: false,
            }).catch(err => console.error("Failed to acknowledge callback:", err.response?.data || err.message));
        
            // Fetch mentors for the selected SE
            const mentors = await getMentorsBySocialEnterprises(enterpriseId);
            console.log("Fetched Mentors:", mentors);
        
            if (mentors.length === 0) {
                await sendMessage(chatId, `⚠️ No mentors available under *${selectedEnterprise.team_name}*.`);
                return res.sendStatus(200);
            }
        
            // Map mentor options
            const mentorOptions = mentors.map(m => ({
                text: m.text,
                callback_data: m.callback_data
            }));
        
            // Wrap in a 2D array
            const inlineKeyboard = mentorOptions.map(option => [option]);
        
            await sendMessageWithOptions(
                chatId,
                `✅ You selected *${selectedEnterprise.team_name}*!\n\nPlease choose your Mentor:`,
                inlineKeyboard
            );
        
            return res.sendStatus(200);
          } else if (data.startsWith("mentor_")) {
            const mentorId = data.replace("mentor_", "");
            const selectedMentor = await getMentorById(mentorId);
        
            if (!selectedMentor) {
                return res.sendStatus(400); // Invalid selection
            }
        
            // Ensure SE data is already stored
            if (!userSelections[chatId]) {
                console.error("❌ No SE selection found for user:", chatId);
                return res.sendStatus(400);
            }
        
            // Store the Mentor selection temporarily
            userSelections[chatId].mentor_id = selectedMentor.mentor_id;
            userSelections[chatId].mentor_name = `${selectedMentor.mentor_firstName} ${selectedMentor.mentor_lastName}`;
        
            console.log(`✅ Stored mentor selection for user ${chatId}:`, userSelections[chatId]);
        
            // Acknowledge the callback query immediately
            axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text: "✅ Choice received!",
                show_alert: false,
            }).catch(err => console.error("Failed to acknowledge callback:", err.response?.data || err.message));
        
            // Final confirmation message
            await sendMessage(chatId, `✅ You are now registered under *${userSelections[chatId].se_name}* with Mentor *${userSelections[chatId].mentor_name}*.\n\nWelcome to LSEED Insight!`);
        
            // Debugging logs
            console.log("ChatID: ", chatId);
            console.log("Username: ", userName);
            console.log("First Name: ", firstName);
            console.log("Selected SE Name:", userSelections[chatId].se_name);
            console.log("Selected SE ID:", userSelections[chatId].se_id);
            console.log("Selected Mentor Name:", userSelections[chatId].mentor_name);
            console.log("Selected Mentor ID:", userSelections[chatId].mentor_id);

            // Insert into Database
            await insertTelegramUser(chatId,userName,firstName,userSelections);

            delete userSelections[chatId];

            console.log(`🗑️ Cleared stored selections for user ${chatId}`);

            console.log(userSelections);
        
            return res.sendStatus(200);
        }
    } catch (error) {
        console.error("Error processing callback query:", error);
        return res.sendStatus(500); // Internal server error if callback fails
    }
}

});

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

app.post("/evaluate", async (req, res) => {
  try {
    const { evaluations, evaluatorId, mentorId } = req.body;

    // Check if evaluations exist
    if (!evaluations || Object.keys(evaluations).length === 0) {
      return res.status(400).json({ error: "No evaluations received." });
    }

    // Debugging: Log mentorId to confirm it is an ID
    console.log("📥 Received evaluations from:", mentorId);

    // Check if mentorId is actually an ID
    if (mentorId.includes(" ")) { // A name has spaces, an ID does not
      console.error("❌ ERROR: mentorId is a name, not an ID!");
      return res.status(400).json({ error: "Invalid mentor ID format" });
    }

    // Get mentor's full name from evaluatorId
    const mentorName = await getUserName(evaluatorId);
    console.log("🧑‍🏫 Evaluator:", mentorName.full_name);

    // Extract SE IDs from evaluations object
    const seIds = Object.keys(evaluations);
    console.log("📥 Evaluating SEs:", seIds.join(", "));

    // Loop through each SE being evaluated
    for (const seId of seIds) {
      const evaluationData = evaluations[seId];
      console.log(`📊 Processing evaluation for SE ${seId}:`, evaluationData);
    }

    res.json({ message: "Evaluations received successfully." });

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

  } catch (error) {
    console.error("❌ Error handling evaluation submission:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
const PORT = 4000;

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
