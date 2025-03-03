const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { router: authRoutes, requireAuth } = require("./routes/authRoutes");
const axios = require("axios");
const ngrok = require("ngrok"); // Exposes your local server to the internet
const { getPrograms, getProgramNameByID, getProgramCount, getProgramsForTelegram } = require("./controllers/programsController");
const { getTelegramUsers, insertTelegramUser, getSocialEnterprisesUsersByProgram } = require("./controllers/telegrambotController");
const { getSocialEnterprisesByProgram, getSocialEnterpriseByID, getAllSocialEnterprises, getAllSocialEnterprisesWithMentorship, getTotalSECount, getSEWithOutMentors, getPreviousTotalSECount, getPreviousMonthSEWithOutMentors } = require("./controllers/socialenterprisesController");
require("dotenv").config();
const { getUsers, getUserName } = require("./controllers/usersController");
const pgDatabase = require("./database.js"); // Import PostgreSQL client
const pgSession = require("connect-pg-simple")(session);
const cookieParser = require("cookie-parser");
const { addProgram } = require("./controllers/programsController");
const { getMentorsBySocialEnterprises, getMentorById, getAllMentors, getUnassignedMentors, getPreviousUnassignedMentors, getAssignedMentors, getWithoutMentorshipCount, getLeastAssignedMentor, getMostAssignedMentor, getMentorDetails } = require("./controllers/mentorsController.js");
const { getAllSDG } = require("./controllers/sdgController.js");
const { addSocialEnterprise } = require("./controllers/socialenterprisesController");
const { getMentorshipsByMentorId, getMentorBySEID, getSEWithMentors, getPreviousSEWithMentors, getMentorshipCount } = require("./controllers/mentorshipsController.js");
const { getPreDefinedComments } = require("./controllers/predefinedcommentsController.js");
const { getEvaluationsByMentorID, getEvaluationDetails, getTopSEPerformance, getSingleSEPerformanceTrend, getPerformanceTrendBySEID, getCommonChallengesBySEID, getPermanceScoreBySEID, getAllSECommonChallenges, getAverageScoreForAllSEPerCategory, getImprovementScorePerMonthAnnually, getImprovementScoreOverallAnnually, getGrowthScoreOverallAnually, getMonthlyGrowthDetails, getSELeaderboards, updateAcknowledgeEvaluation } = require("./controllers/evaluationsController.js");
const { getActiveMentors } = require("./controllers/mentorsController");
const { getSocialEnterprisesWithoutMentor } = require("./controllers/socialenterprisesController");
const { updateSocialEnterpriseStatus } = require("./controllers/socialenterprisesController");
const { getPerformanceOverviewBySEID, getEvaluationScoreDistribution } = require("./controllers/evaluationcategoriesController.js");
const app = express();
const bot = require("./controllers/telegrambotController.js");


// Enable CORS with credentials
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Configure session handling
app.use(
  session({
    store: new pgSession({
      pool: pgDatabase,
      tableName: "session", // Ensure this matches your actual session store table
    }),
    
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
app.use(cookieParser());

// Use authentication routes
app.use("/auth", authRoutes);

// Temporary storage for user states
const userStates = {};
// Timeout duration (in milliseconds) before clearing stale states
const STATE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const PASSWORD = 'q@P#3_4)V5vUw+LJ!F'; // Set a secure password for authentication
const userSelections = {}; // Store selections temporarily before final save

// Helper function to send plain messages (without buttons)
async function sendMessage(chatId, message) {
  try {
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    };

    const response = await axios.post(TELEGRAM_API_URL, payload);
    return response.data.result; // Returns the message details
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

// Function to send message with "Acknowledge" button
async function sendAcknowledgeButton(chatId, message, evaluationId) {
  try {
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "✅ Acknowledge", callback_data: `ack_${evaluationId}` }]],
      },
    };

    const response = await axios.post(TELEGRAM_API_URL, payload);
    
    // ✅ Store the message ID for future removal
    userStates[chatId] = { acknowledgeMessageId: response.data.result.message_id };
    console.log(`📌 Stored acknowledgeMessageId for chat ${chatId}:`, userStates[chatId].acknowledgeMessageId);

    return response.data.result;
  } catch (error) {
    console.error("❌ Failed to send acknowledgment button:", error.response?.data || error.message);
    throw new Error(`Failed to send acknowledgment button: ${error.message}`);
  }
}

// Function to send message with "Acknowledge" button
async function sendStartMentorButton(chatId, message, mentorId) {
  try {
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Start Evaluation", callback_data: `mentoreval_${mentorId}` }]],
      },
    };

    const response = await axios.post(TELEGRAM_API_URL, payload);
    
    return response.data.result;
  } catch (error) {
    console.error("❌ Failed to send acknowledgment button:", error.response?.data || error.message);
    throw new Error(`Failed to send acknowledgment button: ${error.message}`);
  }
}

async function acknowledgeCallback(callbackQueryId) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: "✅ Choice received!",
      show_alert: false,
  });
}

async function deletePreviousMessages(chatId, keys) {
  for (const key of keys) {
      if (userStates[chatId]?.[key]) {
          await deleteMessage(chatId, userStates[chatId][key]);
          delete userStates[chatId][key];
      }
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
    const response = await axios.post(TELEGRAM_API_URL, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: options, // Use directly without mapping
      },
    });

    if (response.data && response.data.result) {
      return response.data.result; // Ensure it returns the actual message object
    } else {
      console.error("⚠️ Failed to send message with options. Response:", response.data);
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
    return null;
  }
}

// ==========================
// 📌 FUNCTION 2: Send Mentorship Scheduling Message (New Function)
// ==========================
function sendMentorshipMessage(chatId, mentorship_id, mentorship_date) {
  console.log(`📩 Sending Mentorship Schedule Message to Chat ID: ${chatId}`);

  const message = `📅 *New Mentorship Request*\n\n`
    + `🔹 *Date:* ${mentorship_date}\n`
    + `🔹 *Mentorship ID:* ${mentorship_id}\n\n`
    + `✅ Please acknowledge or decline this schedule.`;

  const options = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Acknowledge", callback_data: `acknowledge_${mentorship_id}` }],
        [{ text: "❌ Decline", callback_data: `decline_${mentorship_id}` }]
      ]
    }
  };

  bot.sendMessage(chatId, message, options)
    .then(() => console.log("✅ Mentorship Message Sent!"))
    .catch(err => console.error("❌ Error sending mentorship message:", err));
}



app.get("/api/mentors", async (req, res) => {
  try {
    const mentors = await getAllMentors();
    res.json(mentors);
  } catch (error) {
    console.error("❌ Error fetching mentors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/dashboard-stats", async (req, res) => {
  try {
    // ✅ Fetch the number of unassigned mentors (mentors with no active mentorship)
    const unassignedMentors = await getUnassignedMentors();

    // ✅ Fetch unassigned mentors from the previous week
    const previousUnassignedMentors = await getPreviousUnassignedMentors();

    // ✅ Fetch the number of assigned mentors (mentors with at least one active mentorship)
    const assignedMentors = await getAssignedMentors();

    // ✅ Fetch the total number of social enterprises
    const totalSocialEnterprises = await getTotalSECount();

    // ✅ Fetch the number of programs
    const totalPrograms = await getProgramCount();

    res.json({
      unassignedMentors: parseInt(unassignedMentors[0].count), // ✅ Fix here
      previousUnassignedMentors: parseInt(previousUnassignedMentors[0].count), // ✅ Fix here
      assignedMentors: parseInt(assignedMentors[0].count), // ✅ Fix here
      totalSocialEnterprises: parseInt(totalSocialEnterprises[0].count), // ✅ Fix here
      totalPrograms: parseInt(totalPrograms[0].count), // ✅ Fix here
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentor-stats", async (req, res) => {
  try {
    // ✅ Fetch data
    const mentorshipCount = await getMentorshipCount();
    const mentorsWithMentorshipCount = await getMentorshipCount();
    const mentorsWithoutMentorshipCount = await getWithoutMentorshipCount();
    const leastAssignedMentor = await getLeastAssignedMentor();
    const mostAssignedMentor = await getMostAssignedMentor();
    const totalSECount = await getTotalSECount();

    res.json({
      mentorCountTotal: mentorshipCount,
      mentorWithMentorshipCount: mentorsWithMentorshipCount,
      mentorWithoutMentorshipCount: mentorsWithoutMentorshipCount,
      leastAssignedMentor,
      mostAssignedMentor,
      totalSECount,
    });
  } catch (error) {
    console.error("❌ Error fetching mentor stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/analytics-stats", async (req, res) => {
  try {
    // ✅ Fetch data
    const totalSocialEnterprises = await getTotalSECount();
    const withMentorship = await getSEWithMentors();
    const withoutMentorship = await getSEWithOutMentors();
    const growthScore = await getGrowthScoreOverallAnually();
    const previousTotalSocialEnterprises = await getPreviousTotalSECount();

    const currentWithMentorshipCount = parseInt(withMentorship[0]?.total_se_with_mentors || 0);
    const currentWithoutMentorshipCount = parseInt(withoutMentorship[0]?.total_se_without_mentors || 0);
    
    // ✅ Total Growth (sum of `growth`)
    const currentGrowthScoreValue = growthScore.reduce((sum, entry) => sum + parseFloat(entry.growth || 0), 0);

    // ✅ Get the latest cumulative growth value
    const cumulativeGrowthValue = growthScore.length > 0 ? parseFloat(growthScore[growthScore.length - 1].cumulative_growth || 0) : 0;

    const allCommonChallenges = await getAllSECommonChallenges();
    const categoricalScoreForAllSE = await getAverageScoreForAllSEPerCategory();
    const improvementScore = await getImprovementScorePerMonthAnnually();
    const evaluationScoreDistribution = await getEvaluationScoreDistribution();
    const leaderboardData = await getSELeaderboards();

    // ✅ Return Response
    res.json({
      totalSocialEnterprises: parseInt(totalSocialEnterprises[0].count),
      previousMonthSECount: parseInt(previousTotalSocialEnterprises[0].count),
      withMentorship: currentWithMentorshipCount,
      withoutMentorship: currentWithoutMentorshipCount,
      allCommonChallenges,
      categoricalScoreForAllSE,
      improvementScore,
      growthScoreTotal: currentGrowthScoreValue.toFixed(2), 
      cumulativeGrowth: cumulativeGrowthValue.toFixed(2),  
      evaluationScoreDistribution,
      leaderboardData,
      growthScore,
    });

  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
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

    let { mentorId, se_id, evaluations } = req.body;
    if (!Array.isArray(se_id)) se_id = [se_id];

    console.log("🔹 Converted se_id:", se_id);

    let insertedEvaluations = [];

    for (let singleSeId of se_id) {
      console.log(`📤 Processing SE: ${singleSeId}`);

      // ✅ Insert into `evaluations`
      const evalQuery = `
        INSERT INTO evaluations (mentor_id, se_id, created_at, "isAcknowledge")
        VALUES ($1, $2, NOW(), false)
        RETURNING evaluation_id;
      `;
      console.log("Evaluation Query: ", evalQuery);
      const evalRes = await pgDatabase.query(evalQuery, [mentorId, singleSeId]);
      const evaluationId = evalRes.rows[0].evaluation_id;
      console.log("✅ Inserted Evaluation ID:", evaluationId);

      let evaluationDetails = "";

      // ✅ Insert into `evaluation_categories` and `evaluation_selected_comments`
      for (const [category, details] of Object.entries(evaluations)) {
        const categoryQuery = `
          INSERT INTO evaluation_categories (evaluation_id, category_name, rating, additional_comment)
          VALUES ($1, $2, $3, $4)
          RETURNING evaluation_category_id;
        `;
        console.log("Category Query: ", categoryQuery);
        const categoryRes = await pgDatabase.query(categoryQuery, [
          evaluationId,
          category,
          details.rating,
          details.comments || "",
        ]);
        const categoryId = categoryRes.rows[0].evaluation_category_id;

        if (details.selectedCriteria.length > 0) {
          for (const comment of details.selectedCriteria) {
            const commentQuery = `
              INSERT INTO evaluation_selected_comments (evaluation_category_id, comment)
              VALUES ($1, $2);
            `;
            console.log("Comment Query: ", commentQuery);
            await pgDatabase.query(commentQuery, [categoryId, comment]);
          }
        }

        // ✅ Format evaluation details
        const formattedCategory = category.replace(/([A-Z])/g, " $1").replace(/\b\w/g, char => char.toUpperCase());
        evaluationDetails += `📝 *${formattedCategory}:* ${"⭐".repeat(details.rating)} (${details.rating}/5)\n`;
        evaluationDetails += `📌 *Key Points:*\n${details.selectedCriteria.map(c => `- ${c}`).join("\n")}\n`;
        evaluationDetails += details.comments ? `💬 *Comments:* ${details.comments}\n\n` : `💬 *Comments:* No comments provided.\n\n`;
      }

      insertedEvaluations.push(evaluationId);

      // ✅ Get mentor's chat ID from Telegram Bot Table
      const chatIdQuery = `
        SELECT chatid FROM telegrambot WHERE mentor_id = $1 AND "se_ID" = $2;
      `;
      const chatIdResult = await pgDatabase.query(chatIdQuery, [mentorId, singleSeId]);

      if (chatIdResult.rows.length === 0) {
        console.warn(`⚠️ No chat ID found for mentor ${mentorId} and SE ${singleSeId}`);
        continue;
      }

      // ✅ Get mentor and SE details
      const mentorQuery = `SELECT mentor_firstname, mentor_lastname FROM mentors WHERE mentor_id = $1;`;
      const mentorResult = await pgDatabase.query(mentorQuery, [mentorId]);
      const mentor = mentorResult.rows[0];

      const seQuery = `SELECT team_name FROM socialenterprises WHERE se_id = $1;`;
      const seResult = await pgDatabase.query(seQuery, [singleSeId]);
      const socialEnterprise = seResult.rows[0];

      for (const row of chatIdResult.rows) {
        const chatId = row.chatid;
        console.log(`📩 Sending evaluation message to chat ID: ${chatId}`);

        let message = `📢 *New Evaluation Received*\n\n`;
        message += `👤 *Mentor:* ${mentor.mentor_firstname} ${mentor.mentor_lastname}\n`;
        message += `🏢 *Social Enterprise:* ${socialEnterprise.team_name}\n\n`;
        message += evaluationDetails;

        await sendMessage(chatId, message);

        // Send the "Acknowledge" button separately with a meaningful message
        const sendAcknowledgeButtonMessage = await sendAcknowledgeButton(chatId, "Please acknowledge this evaluation.", evaluationId);   

        userStates[chatId] = { sendAcknowledgeButtonId: sendAcknowledgeButtonMessage.message_id };
      }
    }

    res.status(201).json({ message: "Evaluations added successfully", evaluations: insertedEvaluations });
  } catch (error) {
    console.error("❌ INTERNAL SERVER ERROR:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

app.post("/evaluate-mentor", async (req, res) => {
  try {
    let { mentorId, programs } = req.body;

    if (!mentorId || !Array.isArray(programs) || programs.length === 0) {
      return res.status(400).json({ message: "Invalid request. Missing mentorId or programs." });
    }

    const mentorDetails = await getMentorDetails(mentorId);
    console.log("This is the programs ", programs)
    console.log(`This is the mentor name: ${mentorDetails[0].mentor_firstname} ${mentorDetails[0].mentor_lastname}`);

    // ✅ Fetch chat IDs
    const chatIdResults = await getSocialEnterprisesUsersByProgram(programs);

    console.log("📡 Chat IDs Retrieved:", chatIdResults);

    if (!chatIdResults || chatIdResults.length === 0) {
      return res.status(404).json({ message: "No chat IDs found for the selected programs." });
    }

    // ✅ Send messages
    console.log("📨 Sending messages to:", chatIdResults);

    // Send the "Acknowledge" button separately with a meaningful message
    //const sendAcknowledgeButtonMessage = 
    if (chatIdResults.length > 0) {
      for (const chatId of chatIdResults) {
        const startEvaluationMessage = await sendStartMentorButton(chatId, `Start Evaluation for ${mentorDetails[0].mentor_firstname} ${mentorDetails[0].mentor_lastname}`, mentorId);
        userStates[chatId] = { startEvaluationMessageId: startEvaluationMessage.message_id };
      }
    } else {
      console.log("❌ No chat IDs found to send messages.");
    }
  } catch (error) {
    console.error("❌ INTERNAL SERVER ERROR:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// Example of a protected route
app.get("/protected", requireAuth, (req, res) => {
  res.json({ message: "Access granted to protected route" });
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await getUsers(); // Fetch users from DB
    // console.log("[server] Fetched users:", users); // Debug here
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getAllSocialEnterprisesWithMentorship", async (req, res) => {
  try {
    const result = await getAllSocialEnterprisesWithMentorship(); // Fetch SEs from DB
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No social enterprises found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getAllSDG", async (req, res) => {
  try {
    const sdgs = await getAllSDG(); // Fetch SDGs from the controller
    res.json(sdgs); // Send the SDGs as JSON
  } catch (error) {
    console.error("Error fetching SDGs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getAllSocialEnterprises", async (req, res) => {
  try {
    const result = await getAllSocialEnterprises(); // Fetch SEs from DB
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No social enterprises found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getMentorEvaluations", async (req, res) => {
  try {
    const { mentor_id } = req.query; // Extract mentor_id from query parameters

    if (!mentor_id) {
      return res.status(400).json({ message: "mentor_id is required" });
    }

    const result = await getEvaluationsByMentorID(mentor_id); // Fetch SEs from DB
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No evaluations found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getEvaluationDetails", async (req, res) => {
  try {
      const { evaluation_id } = req.query; // Extract evaluation_id from query parameters

      if (!evaluation_id) {
          return res.status(400).json({ message: "evaluation_id is required" });
      }

      const result = await getEvaluationDetails(evaluation_id); // Fetch evaluation details from DB

      if (!result || result.length === 0) {
          return res.status(404).json({ message: "No evaluation details found" });
      }

      res.json(result);
  } catch (error) {
      console.error("❌ Error fetching evaluation details:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/top-se-performance", async (req, res) => {
  try {
    const result = await getTopSEPerformance();

    if (result.length === 0) {  // ✅ result is already an array
      return res.json({ message: "No performance data available" });
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching top SE performance:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/single-se-performance/:se_id", async (req, res) => {
  const { se_id } = req.params;
  try {
    console.log(se_id);
    const result = await getPerformanceTrendBySEID(se_id);
    
    if (!result || result.length === 0) {
      return res.json({ message: "No performance trend data available" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching performance trend:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/common-challenges/:se_id", async (req, res) => {
  const { se_id } = req.params;
  try {
    console.log(se_id);
    const result = await getCommonChallengesBySEID(se_id);
    
    if (!result || result.length === 0) {
      return res.json({ message: "No common challenges data available" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching performance trend:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/likert-data/:se_id", async (req, res) => {
  const { se_id } = req.params;
  try {
    const result = await getPermanceScoreBySEID(se_id);
    
    if (!result || result.length === 0) {
      return res.json({ message: "No performance score data available" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching performance score:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/radar-data/:se_id", async (req, res) => {
  const { se_id } = req.params;
  try {
    console.log(se_id);
    const result = await getPerformanceOverviewBySEID(se_id);
    
    if (!result || result.length === 0) {
      return res.json({ message: "No performance overview data available" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching performance overview:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getMentorshipsbyID", async (req, res) => {
  try {
    const { mentor_id } = req.query; // Extract mentor_id from query parameters

    if (!mentor_id) {
      return res.status(400).json({ message: "mentor_id is required" });
    }

    // Fetch mentorships based on mentor_id from the database
    const mentorships = await getMentorshipsByMentorId(mentor_id) // Assume this function exists in your DB logic

    if (!mentorships || mentorships.length === 0) {
      return res.status(404).json({ message: "No mentorships found for the given mentor_id" });
    }

    res.json(mentorships); // Send the mentorships data
  } catch (error) {
    console.error("Error fetching mentorships:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.get("/getPreDefinedComments", async (req, res) => {
  try {
    const data = await getPreDefinedComments(); // Fetch predefined comments

    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ error: "No predefined comments found" });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching predefined comments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// API endpoint to fetch all programs
app.get("/getPrograms", async (req, res) => {
  try {
    const programs = await getPrograms(); // Fetch programs from the controller
    res.json(programs); // Send the programs as JSON
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fetch active mentors
app.get("/api/active-mentors", async (req, res) => {
  try {
    const activeMentors = await getActiveMentors();
    res.json(activeMentors);
  } catch (error) {
    console.error("Error fetching active mentors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fetch social enterprises without mentors
app.get("/api/social-enterprises-without-mentor", async (req, res) => {
  try {
    const socialEnterprises = await getSocialEnterprisesWithoutMentor();
    res.json(socialEnterprises);
  } catch (error) {
    console.error("Error fetching social enterprises without mentors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getSocialEnterprisesByID", async (req, res) => {
  try {
    const { se_id } = req.query; // Extract mentor_id from query parameters

    if (!se_id) {
      return res.status(400).json({ message: "se_id is required" });
    }

    // Fetch mentorships based on mentor_id from the database
    const se = await getSocialEnterpriseByID(se_id) // Assume this function exists in your DB logic

    if (!se || se.length === 0) {
      return res.status(404).json({ message: "No se found for the given se_id" });
    }

    res.json(se); // Send the mentorships data
  } catch (error) {
    console.error("Error fetching mentorships:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// API endpoint to add a new social enterprise
app.post("/api/social-enterprises", async (req, res) => {
  try {
    const socialEnterpriseData = req.body; // Extract data from the request body
    const newSocialEnterprise = await addSocialEnterprise(socialEnterpriseData); // Call the controller function

    res.status(201).json({
      message: "Social Enterprise added successfully",
      data: newSocialEnterprise,
    });
  } catch (error) {
    console.error("Error adding social enterprise:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//For Testing only
app.get("/test-api", async (req, res) => {
  try {
    const result = await getProgramsForTelegram()

    res.json(result);
  } catch (error) {
    console.error("Error in testing:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }

});

app.post("/webhook", async (req, res) => {
  const message = req.body.message || req.body.edited_message;
  const callbackQuery = req.body.callback_query;

  async function acknowledgeCallback(callbackQueryId) {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text: "✅ Choice received!",
      show_alert: false,
    });
  }

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

  // Debounce mechanism to prevent rapid duplicate requests
  const debounceTimeouts = {};
  const debounceRequest = (chatId, callback) => {
    if (debounceTimeouts[chatId]) {
      console.log(`Debouncing request from user ${chatId}`);
      return res.sendStatus(200); // Ignore duplicate requests
    }

    debounceTimeouts[chatId] = setTimeout(() => {
      delete debounceTimeouts[chatId];
    }, 2000); // 2-second debounce period

    callback();
  };

  // Track processed callback queries to prevent duplicates
  const processedCallbacks = new Set();
  const isDuplicateCallback = (callbackQueryId) => {
    if (processedCallbacks.has(callbackQueryId)) {
      console.log(`Duplicate callback query received: ${callbackQueryId}`);
      return true;
    }
    processedCallbacks.add(callbackQueryId);

    // Clear the callback ID after some time to prevent memory growth
    setTimeout(() => {
      processedCallbacks.delete(callbackQueryId);
    }, 60000); // Keep track for 1 minute

    return false;
  };

  // Rate limiting to restrict excessive interactions
  const rateLimits = {};
  const isRateLimited = (chatId) => {
    const now = Date.now();
    if (rateLimits[chatId] && now - rateLimits[chatId] < 2000) {
      console.log(`Rate limit exceeded for user ${chatId}`);
      return true;
    }
    rateLimits[chatId] = now;
    return false;
  };

  // Handle text messages (Registration, Password Check)
  if (message) {
    const chatId = message.chat.id;

    // Apply debounce and rate limiting
    if (isRateLimited(chatId)) {
      return res.sendStatus(200);
    }
    debounceRequest(chatId, async () => {
      try {
        const [existingUser, options] = await Promise.all([
          getTelegramUsers(chatId),
          getProgramsForTelegram(),
        ]);

        // If user already exists, prevent re-registration
        if (existingUser) {
          if (message.text === "/start") {
            await sendMessage(
              chatId,
              "✅ You are already registered! No need to enter the password again."
            );
          } else {
            return res.sendStatus(200);
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

        const formattedOptions = options.map(option => [option]); // Ensure 2D array
        console.log("✅ Formatted Inline Keyboard:", JSON.stringify(formattedOptions, null, 2)); 

        // If user enters password and options are available
        if (
          userStates[chatId]?.state === "awaiting_password" &&
          message.text.trim().toLowerCase() === PASSWORD.toLowerCase()
        ) {
          setUserState(chatId, "awaiting_program_selection"); // Transition to program selection
          if (formattedOptions.length === 0) {
            await sendMessage(
              chatId,
              "⚠️ No programs available at the moment. Please try again later."
            );
            delete userStates[chatId]; // Reset state if no programs are available
            return res.sendStatus(200);
          }
          const confirmationMessage = await sendMessageWithOptions(
            chatId,
            "✅ Password correct! You have been successfully registered.\n\nPlease choose your program:",
            formattedOptions
          );
          
          // Update userStates
          userStates[chatId] = { confirmationMessageId: confirmationMessage?.message_id || null };

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
        return res.sendStatus(500);
      }
    });
  }

  // Handle callback queries (Program, Social Enterprise, Mentor Selection)
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

    // Apply debounce and rate limiting
    if (isRateLimited(chatId)) {
      return res.sendStatus(200);
    }
    debounceRequest(chatId, async () => {
      // Prevent duplicate callback queries
      if (isDuplicateCallback(callbackQueryId)) {
        return res.sendStatus(200);
      }
      try {
        console.log("This is the current data: ", data)
        console.log("This is the chatid: ", chatId)
        
        if (data.startsWith("program_")) {
              await deletePreviousMessages(chatId, ["confirmationMessageId"]);
              await deletePreviousMessages(chatId, ["chooseAgainID"]);
              const programId = data.replace("program_", "");
              const selectedProgram = await getProgramNameByID(programId);
              if (!selectedProgram) return res.sendStatus(400);
          
              userSelections[chatId] = { programId, programName: selectedProgram };
              const programInlineKeyboard = [
                  [{ text: "Confirm", callback_data: `confirm_program_${programId}` }],
                  [{ text: "Pick Again", callback_data: "pick_program_again" }],
              ];
          
              const confirmationMessage = await sendMessageWithOptions(
                  chatId,
                  `✅ You selected *${selectedProgram}*!\n\nPlease confirm your selection:`,
                  programInlineKeyboard
              );
              userStates[chatId] = { confirmationMessageId: confirmationMessage.message_id };
              return res.sendStatus(200);
        }
          
        if (data.startsWith("confirm_program_")) {
            const programId = data.replace("confirm_program_", "");
            const selectedProgram = await getProgramNameByID(programId);
            
            if (!selectedProgram) return res.sendStatus(400);
        
            // Store the program in userSelections
            userSelections[chatId] = { programId, programName: selectedProgram };
            
            console.log("Stored programId in userSelections:", userSelections[chatId]); // Debugging
        
            await deletePreviousMessages(chatId, ["confirmationMessageId", "programSelectionMessageId"]);
        
            const socialEnterprises = await getSocialEnterprisesByProgram(programId);
            if (!socialEnterprises.length) {
                await sendMessage(chatId, `⚠️ No Social Enterprises found under *${selectedProgram}*.`);
                return res.sendStatus(200);
            }
        
            const inlineKeyboard = socialEnterprises.map(se => [{ text: se.abbr, callback_data: se.callback_data }]);
            const enterpriseOptionsMessage = await sendMessageWithOptions(chatId, `✅ *${selectedProgram}* confirmed!\n\nPlease select a Social Enterprise:`, inlineKeyboard);
            userStates[chatId] = { enterpriseOptionsMessageID: enterpriseOptionsMessage.message_id };

            return res.sendStatus(200);
        }
          
        if (data === "pick_program_again") {
              await deletePreviousMessages(chatId, ["confirmationMessageId"]);
              setUserState(chatId, "awaiting_program_selection");
          
              const programs = await getProgramsForTelegram();
              if (!programs.length) {
                  await sendMessage(chatId, "⚠️ No programs available at the moment.");
                  return res.sendStatus(200);
              }
              const formattedOptions = programs.map(option => [option]); // Ensure 2D array
          
              const newSelectionMessage = await sendMessageWithOptions(chatId, "🔄 Please choose your program again:", formattedOptions);
              userStates[chatId] = { chooseAgainID: newSelectionMessage.message_id };
              if (newSelectionMessage?.message_id) userStates[chatId].programSelectionMessageId = newSelectionMessage.message_id;
              return res.sendStatus(200);
        }
          
        if (data.startsWith("enterprise_")) {
            await deletePreviousMessages(chatId, ["enterpriseOptionsMessageID"]);
            await deletePreviousMessages(chatId, ["newSeOptionsMessageID"]);
            const enterpriseId = data.replace("enterprise_", "");
            const selectedEnterprise = await getSocialEnterpriseByID(enterpriseId);
            if (!selectedEnterprise) return res.sendStatus(400);
        
            // Preserve programId while adding SE selection
            const existingSelection = userSelections[chatId] || {};
            userSelections[chatId] = { 
                ...existingSelection, // Preserve existing data
                se_id: selectedEnterprise.se_id, 
                se_name: selectedEnterprise.team_name 
            };
        
            console.log("Updated userSelections:", userSelections[chatId]); // Debugging
        
            await acknowledgeCallback(callbackQueryId);
        
            const inlineKeyboard = [
                [{ text: "Confirm", callback_data: `confirm_${enterpriseId}` }],
                [{ text: "Pick Again", callback_data: "pick_again" }],
            ];
            
            const confirmationMessage = await sendMessageWithOptions(
                chatId,
                `✅ You selected *${selectedEnterprise.team_name}*!\n\nPlease confirm your selection:`,
                inlineKeyboard
            );
            userStates[chatId] = { confirmationMessageID: confirmationMessage.message_id };
            return res.sendStatus(200);
        }
          
        if (data.startsWith("confirm_")) {
              await deletePreviousMessages(chatId, ["confirmationMessageID"]);
              const enterpriseId = data.replace("confirm_", "");
              const selectedEnterprise = await getSocialEnterpriseByID(enterpriseId);
              if (!selectedEnterprise) return res.sendStatus(400);
          
              const mentors = await getMentorBySEID(enterpriseId);
              if (!mentors.length) {
                  await sendMessage(chatId, `⚠️ No mentors available under *${selectedEnterprise.team_name}*.`);
                  return res.sendStatus(200);
              }
          
              const mentor = mentors[0];
              await sendMessage(chatId, `✅ You are now registered under *${selectedEnterprise.team_name}* with Mentor *${mentor.name}*.`);
          
              await insertTelegramUser(chatId, userName, firstName, userSelections, mentor.mentor_id);
              delete userSelections[chatId];
              delete userStates[chatId];
              return res.sendStatus(200);
        }
          
        if (data === "pick_again") {
            await deletePreviousMessages(chatId, ["confirmationMessageID"]);
        
            console.log("userSelections before processing:", userSelections[chatId]); // Debugging
        
            // Retrieve programId from userSelections before clearing other data
            const programId = userSelections[chatId]?.programId;
            if (!programId) {
                await sendMessage(chatId, "⚠️ No program selected. Please start again.");
                console.log("Error: programId is undefined!"); // Debugging
                return res.sendStatus(400);
            }
        
            console.log("Program ID found:", programId); // Debugging
        
            // Preserve only the programId in userSelections
            userSelections[chatId] = { programId };
        
            setUserState(chatId, "awaiting_program_selection");
        
            // Fetch social enterprises for the preserved programId
            const socialEnterprises = await getSocialEnterprisesByProgram(programId);
            if (!socialEnterprises.length) {
                await sendMessage(chatId, "⚠️ No social enterprises available at the moment.");
                return res.sendStatus(200);
            }
        
            // Create inline keyboard for social enterprises
            const inlineKeyboard = socialEnterprises.map(se => [{ text: se.abbr, callback_data: se.callback_data }]);
            const newSeOptionsMessage = await sendMessageWithOptions(chatId, "🔄 Please choose a social enterprise again:", inlineKeyboard);
            
            userStates[chatId] = { newSeOptionsMessageID: newSeOptionsMessage.message_id };

        
            return res.sendStatus(200);
        }
        if (data.startsWith("ack_")) {
          const evaluationId = data.replace("ack_", "");
      
          try {
              await deletePreviousMessages(chatId, ["sendAcknowledgeButtonId"]);
      
              // Mark evaluation as acknowledged in the database
              await updateAcknowledgeEvaluation(evaluationId);
      
              // Send confirmation message
              await sendMessage(chatId, "✅ Evaluation successfully acknowledged!");
      
              // If inside an Express handler, send response
              if (res) return res.sendStatus(200);
          } catch (error) {
              console.error("❌ Error acknowledging evaluation:", error);
              await sendMessage(chatId, "❌ Failed to acknowledge evaluation. Please try again.");
      
              if (res) return res.sendStatus(500);
          }
        }
        if (data.startsWith("mentoreval_")) {
          try {
            await deletePreviousMessages(chatId, ["startEvaluationMessageId"]);
            const mentorEvalID = data.replace("mentoreval_", "");
            
            // Send confirmation message
            await sendMessage(chatId, `✅ Starting Evaluation Now ${mentorEvalID}`);
        
            // If inside an Express handler, send response
            if (res) return res.sendStatus(200);
          } catch (error) {
            console.error("❌ Error acknowledging evaluation:", error);
            await sendMessage(chatId, "❌ Failed to acknowledge evaluation. Please try again.");
        
            if (res) return res.sendStatus(500);
          }
        }

        if (data.startsWith("acknowledge_")) {
          const mentorship_id = data.split("_")[1];
      
          console.log(`🔹 SE acknowledged mentorship ${mentorship_id}`);
      
          // Update status in the database
          await pgDatabase.query(`
            UPDATE mentorships 
            SET telegramstatus = 'Acknowledged'
            WHERE mentorship_id = $1
          `, [mentorship_id]);
      
          bot.sendMessage(chatId, "✅ You have acknowledged the mentorship schedule.");
        } else if (data.startsWith("decline_")) {
          const mentorship_id = data.split("_")[1];
      
          console.log(`🔹 SE declined mentorship ${mentorship_id}`);
      
          // Update status in the database
          await pgDatabase.query(`
            UPDATE mentorships 
            SET telegramstatus = 'Declined'
            WHERE mentorship_id = $1
          `, [mentorship_id]);
      
          bot.sendMessage(chatId, "❌ You have declined the mentorship schedule.");
        }

      } catch (error) {
        console.error("Error processing callback query:", error);
        return res.sendStatus(500); // Internal server error if callback fails
      }
    });
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

// API endpoint to add a new program
app.post("/api/programs", async (req, res) => {
  try {
    const programData = req.body; // Extract data from the request body
    const newProgram = await addProgram(programData); // Call the controller function

    res.status(201).json({
      message: "Program added successfully",
      data: newProgram,
    });
  } catch (error) {
    console.error("Error adding program:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/mentorships", async (req, res) => {
  try {
    const { mentor_id, se_id } = req.body;

    // Insert the mentorship into the database
    const mentorshipQuery = `
      INSERT INTO mentorships (mentor_id, se_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const mentorshipResult = await pgDatabase.query(mentorshipQuery, [mentor_id, se_id]);

    if (!mentorshipResult.rows.length) {
      return res.status(500).json({ message: "Failed to create mentorship" });
    }

    // Update the social enterprise's `isactive` status to true
    await updateSocialEnterpriseStatus(se_id, true);

    res.status(201).json({ message: "Mentorship added successfully" });
  } catch (error) {
    console.error("Error adding mentorship:", error);
    res.status(500).json({ message: "Internal Server Error" });ZZ
  }
});

app.post("/updateMentorshipDate", async (req, res) => {
  console.log("🔹 Received request at /updateMentorshipDate");
  const { mentorship_id, mentorship_date } = req.body;

  if (!mentorship_id || !mentorship_date) {
    return res.status(400).json({ error: "Mentorship ID and date are required" });
    console.log(`📥 Request data: mentorship_id=${mentorship_id}, mentorship_date=${mentorship_date}`);
  }

  try {
    const query = `
      UPDATE mentorships 
      SET mentorship_date = array_append(mentorship_date ,$1) 
      WHERE mentorship_id = $2
      RETURNING *;
    `;

    const { rows } = await pgDatabase.query(query, [mentorship_date, mentorship_id]);
    console.log(`✅ Mentorship ${mentorship_id} updated to "Pending".`);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mentorship not found" });
    }

    res.json({ message: "Mentorship date updated", mentorship: rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getMentorshipDates", async (req, res) => {
  const { mentor_id } = req.query;
  // console.log("server/getMentorshipDate: mentor_id: ", mentor_id);

  try {
    const result = await pgDatabase.query(
      `SELECT m.se_id, m.mentorship_date, se.team_name, p.name
       FROM mentorships m
       JOIN socialenterprises se ON m.se_id = se.se_id
       JOIN programs p ON se.program_id = p.program_id
       WHERE m.mentor_id = $1`,
      [mentor_id]
    );
    // console.log("server/getMentorshipDate: results: ", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching mentorship dates:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  console.log("Received update request for user ID:", id);

  try {
    const result = await updateUser(id, updatedUser);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedRow = result.rows[0];

    res.json({ 
      message: "User updated successfully", 
      user: { ...updatedRow, id: updatedRow.user_id } // Ensure `id` exists
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

async function updateUser(id, updatedUser) {
  const { first_name, last_name, roles, isactive, email } = updatedUser; // Modify based on your schema

  const query = `
    UPDATE users
    SET first_name = $1, last_name = $2, roles = $3, isactive = $4, email = $5
    WHERE user_id = $6
    RETURNING *;
  `;

  const values = [first_name, last_name, roles, isactive, email, id];

  try {
    const result = await pgDatabase.query(query, values);
    return result;
  } catch (error) {
    console.error("Database update error:", error);
    throw error;
  }
}

// app.put('/updateUserRole/:id', requireAuth, async (req, res) => {
//   const { id } = req.params;
//   const { role } = req.body; // 'admin' or 'user'
//   const updatedUser = req.body;

//   // console.log("Received update request for user ID:", id);

//   try {
//     // Update the user's role in the database
//     const query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
//     const values = [role, id];
//     const result = await pgDatabase.query(query, values);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json(result.rows[0]); // Respond with updated user data
//   } catch (error) {
//     console.error("Error updating user role:", error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// ==========================
// 📌 API: Check Pending Meetings (Telegram Notification)
// ==========================
app.get("/checkPendingMeetings", async (req, res) => {
  try {
    console.log("🔍 Running checkPendingMeetings API...");

    const query = `
      SELECT m.mentorship_id, m.se_id, m.mentorship_date, t.chatid
      FROM mentorships m
      JOIN telegrambot t ON m.se_id = t."se_ID"
      WHERE m.telegramstatus = 'Pending'
    `;

    const result = await pgDatabase.query(query);
    console.log("📄 Query Result:", result.rows);

    if (result.rows.length === 0) {
      console.log("❌ No pending mentorships found.");
      return res.json({ message: "No pending mentorship requests." });
    }

    for (const row of result.rows) {
      const { mentorship_id, se_id, mentorship_date, chatid } = row;

      if (!chatid) {
        console.warn(`⚠️ No Telegram chat ID found for SE ID ${se_id}`);
        continue;
      }

      console.log(`📩 Sending message to Chat ID: ${chatid} for mentorship ${mentorship_id}`);
      sendMentorshipMessage(chatid, mentorship_id, mentorship_date);
    }

    res.json({ success: true, message: "Mentorship messages sent." });

  } catch (error) {
    console.error("❌ ERROR in /checkPendingMeetings:", error.stack);
    res.status(500).json({ error: "Internal Server Error" });
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
    console.error(`❌ Error setting webhook:`, error.response?.data || error.message);

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
