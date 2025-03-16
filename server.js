const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { router: authRoutes, requireAuth } = require("./routes/authRoutes");
const axios = require("axios");
const ngrok = require("ngrok"); // Exposes your local server to the internet
const { getPrograms, getProgramNameByID, getProgramCount, getProgramsForTelegram } = require("./controllers/programsController");
const { getTelegramUsers, insertTelegramUser, getSocialEnterprisesUsersByProgram, countTelegramUsers } = require("./controllers/telegrambotController");
const { getSocialEnterprisesByProgram, 
        getSocialEnterpriseByID, 
        getAllSocialEnterprises, 
        getAllSocialEnterprisesWithMentorship, 
        getTotalSECount, 
        getSEWithOutMentors, 
        getPreviousTotalSECount, 
        getPreviousMonthSEWithOutMentors, 
        getAllSocialEnterpriseswithMentorID, 
        updateSERowUpdate, 
        getAllSocialEnterprisesForComparison,
        getFlaggedSEs} = require("./controllers/socialenterprisesController");
require("dotenv").config();
const { getUsers, getUserName } = require("./controllers/usersController");
const pgDatabase = require("./database.js"); // Import PostgreSQL client
const pgSession = require("connect-pg-simple")(session);
const cookieParser = require("cookie-parser");
const { addProgram } = require("./controllers/programsController");
const { getMentorsBySocialEnterprises, 
        getMentorById, 
        getAllMentors, 
        getUnassignedMentors, 
        getPreviousUnassignedMentors, 
        getAssignedMentors, 
        getWithoutMentorshipCount, 
        getLeastAssignedMentor, 
        getMostAssignedMentor, 
        getMentorDetails, 
        getMentorCount } = require("./controllers/mentorsController.js");
const { getAllSDG } = require("./controllers/sdgController.js");
const { getMentorshipsByMentorId, 
        getMentorBySEID, 
        getSEWithMentors, 
        getPreviousSEWithMentors, 
        getMentorshipCount,
        getPendingSchedules,
        getSchedulingHistory,
        getHandledSEsCountByMentor,
       } = require("./controllers/mentorshipsController.js");
const { addSocialEnterprise } = require("./controllers/socialenterprisesController");
const { getEvaluationsByMentorID, 
        getEvaluationDetails, 
        getTopSEPerformance, 
        getSingleSEPerformanceTrend, 
        getPerformanceTrendBySEID, 
        getCommonChallengesBySEID, 
        getPermanceScoreBySEID, 
        getAverageScoreForAllSEPerCategory, 
        getImprovementScorePerMonthAnnually, 
        getGrowthScoreOverallAnually, 
        getMonthlyGrowthDetails, 
        getSELeaderboards, 
        updateAcknowledgeEvaluation, 
        getTopSEPerformanceByMentorships, 
        getEvaluationsBySEID, 
        getStatsForHeatmap, 
        getEvaluations,
        getAllEvaluationStats,
        getTotalEvaluationCount,
        getPendingEvaluationCount,
        avgRatingPerSE,
        getAcknowledgedEvaluationCount,
        getAcknowledgementData,
        getMentorEvaluationCount,
        getEvaluationDetailsForMentorEvaluation} = require("./controllers/evaluationsController.js");
const { getActiveMentors } = require("./controllers/mentorsController");
const { getSocialEnterprisesWithoutMentor } = require("./controllers/socialenterprisesController");
const { updateSocialEnterpriseStatus } = require("./controllers/socialenterprisesController");
const { getPerformanceOverviewBySEID, getEvaluationScoreDistribution, compareSocialEnterprisesPerformance, getMentorAvgRating, getMentorFrequentRating, getAvgRatingForMentor, getPerformanceOverviewForMentor } = require("./controllers/evaluationcategoriesController.js");
const { getMentorQuestions } = require("./controllers/mentorEvaluationsQuestionsController.js");
const { getPreDefinedComments } = require("./controllers/predefinedcommentsController.js");
const app = express();


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

async function submitMentorEvaluation(chatId, responses) {
  try {
    console.log(`✅ Mentor evaluation completed for Chat ID: ${chatId}`);
    console.log("📋 Submitted Responses:");
    Object.entries(responses).forEach(([category, details]) => {
      console.log(`  - ${category}: ${"⭐".repeat(details.rating)} (${details.rating}/5)`);
    });

    const userState = userStates[chatId];
    if (!userState || !userState.mentorEvalID) {
      console.error("❌ Error: No evaluation session found for this user.");
      return;
    }

    const mentorId = userState.mentorId; // Ensure this is captured when evaluation starts
    const seId = userState.seId; // Ensure this is captured too
    const createdAt = new Date().toISOString();
    const evaluationType = "Mentors"; // Distinguishing this from SE evaluations

    // Insert into evaluations table
    const evalQuery = `
      INSERT INTO public.evaluations (mentor_id, se_id, created_at, "isAcknowledge", evaluation_type)
      VALUES ($1, $2, $3, false, $4)
      RETURNING evaluation_id;
    `;
    const evalRes = await pgDatabase.query(evalQuery, [mentorId, seId, createdAt, evaluationType]);
    const evaluationId = evalRes.rows[0].evaluation_id;
    console.log("✅ Inserted Evaluation ID:", evaluationId);

    // Insert into evaluation_categories table
    for (const [category, details] of Object.entries(responses)) {
      const categoryQuery = `
        INSERT INTO public.evaluation_categories (evaluation_id, category_name, rating, additional_comment)
        VALUES ($1, $2, $3, $4);
      `;
      await pgDatabase.query(categoryQuery, [evaluationId, category, details.rating, details.comments || ""]);
    }

    console.log("✅ Mentor evaluation data successfully stored in DB!");

    // Notify user that evaluation is complete
    await sendMessageWithOptions(chatId, "✅ Mentor evaluation completed! Thank you.", []);

    delete userStates[chatId]; // Clear user state
  } catch (error) {
    console.error("❌ Error submitting mentor evaluation:", error);
  }
}

async function sendNextMentorQuestion(chatId) {
  const userState = userStates[chatId];

  // Fetch questions if not already loaded
  if (!userState.questions || userState.questions.length === 0) {
    userState.questions = await getMentorQuestions();
  }

  // Ensure index is within range
  if (userState.currentQuestionIndex >= userState.questions.length) {
    console.error(`⚠️ Invalid question index for chat ${chatId}`);
    return;
  }

  const question = userState.questions[userState.currentQuestionIndex];

  const options = [
    [
      { text: "1️⃣ - Strongly Disagree", callback_data: "mentorans_1" },
      { text: "2️⃣ - Disagree", callback_data: "mentorans_2" },
    ],
    [
      { text: "3️⃣ - Neutral", callback_data: "mentorans_3" },
      { text: "4️⃣ - Agree", callback_data: "mentorans_4" },
    ],
    [
      { text: "5️⃣ - Strongly Agree", callback_data: "mentorans_5" },
    ],
  ];

  // ✅ Delete previous question messages before sending the new one
  if (userState.mentorQuestionsMessageIds && userState.mentorQuestionsMessageIds.length > 0) {
    await deletePreviousMessages(chatId, userState.mentorQuestionsMessageIds);
  }

  // ✅ Send the new question
  const mentorQuestionsMessage = await sendMessageWithOptions(
    chatId,
    `📢 *Question ${userState.currentQuestionIndex + 1}:* ${question.question_text}\n\n(Select a rating from 1 to 5)`,
    options
  );

  // ✅ Store the message ID in an array
  if (!userState.mentorQuestionsMessageIds) {
    userState.mentorQuestionsMessageIds = [];
  }
  userState.mentorQuestionsMessageIds.push(mentorQuestionsMessage.message_id);
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

async function storeAndDeletePreviousQuestion(chatId, newMessageId, isLastQuestion = false) {
  if (!userStates[chatId]) return;

  // ✅ Delete the last question message before storing the new one
  if (userStates[chatId].questionMessageIds?.length > 0) {
    const lastMessageId = userStates[chatId].questionMessageIds.pop(); // Remove last stored message ID
    await deleteMessage(chatId, lastMessageId);
  }

  // ✅ Store the new question message ID only if it's not the last question
  if (!isLastQuestion) {
    userStates[chatId].questionMessageIds.push(newMessageId);
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

async function sendMentorshipMessage(chatId, mentoring_session_id, mentorship_id, mentorship_date, mentorship_time, zoom_link) {
  console.log(`📩 Sending Mentorship Schedule Message to Chat ID: ${chatId}`);

  if (!Array.isArray(mentorship_date)) {
    mentorship_date = [mentorship_date];
  }

  // Fetch mentor name
  const mentorResult = await pgDatabase.query(
    `SELECT mentor_firstname, mentor_lastname FROM mentors 
     WHERE mentor_id = (SELECT mentor_id FROM mentorships WHERE mentorship_id = $1)`,
    [mentorship_id]
  );
  
  if (mentorResult.rows.length === 0) {
    console.error(`❌ Mentor not found for mentorship ID ${mentorship_id}`);
    return;
  }

  const mentorName = `${mentorResult.rows[0].mentor_firstname} ${mentorResult.rows[0].mentor_lastname}`;

  // Format mentorship date properly
  const formattedDate = mentorship_date.map(dateStr => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  }).join(", ");

  const message = `📅 *New Mentorship Meeting Request*\n\n`
    + `🔹 *Mentor:* ${mentorName}\n`
    + `🔹 *Date:* ${formattedDate}\n`
    + `🔹 *Time:* ${mentorship_time}\n`
    + `🔹 *Zoom Link:* ${zoom_link || "N/A"}\n\n`
    + `📌 Please confirm your availability:`;

  // ✅ Inline keyboard options for Accept/Decline
  const options = [
    [
      { text: `✅ Accept`, callback_data: `acceptschedule_${mentoring_session_id}` },
      { text: `❌ Decline`, callback_data: `declineschedule_${mentoring_session_id}` }
    ]
  ];

  // ✅ Use sendMessageWithOptions to send the message with buttons
  const sentMessageSchedule = await sendMessageWithOptions(chatId, message, options);

  userStates[chatId] = { sentMessageScheduleId: sentMessageSchedule.message_id };
  if (sentMessageSchedule) {
    console.log("✅ Mentorship message sent with buttons:", sentMessageSchedule);
  } else {
    console.error("❌ Failed to send mentorship message.");
  }
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
    const mentorshipCount = await getMentorCount();
    const mentorsWithMentorshipCount = await getMentorshipCount();
    const mentorsWithoutMentorshipCount = await getWithoutMentorshipCount();
    // ✅ Fetch the number of assigned mentors (mentors with at least one active mentorship)
    const assignedMentors = await getAssignedMentors();

    // ✅ Fetch the total number of social enterprises
    const totalSocialEnterprises = await getTotalSECount();

    // ✅ Fetch the number of programs
    const totalPrograms = await getProgramCount();

    res.json({
      mentorCountTotal: mentorshipCount,
      mentorWithMentorshipCount: mentorsWithMentorshipCount,
      mentorWithoutMentorshipCount: mentorsWithoutMentorshipCount,
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
    const mentorshipCount = await getMentorCount();
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

app.get("/api/pending-schedules", async (req, res) => {
  try {
    const result = await getPendingSchedules();

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/flagged-ses", async (req, res) => {
  try {
    const result = await getFlaggedSEs();

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/ack-data", async (req, res) => {
  try {
    const result = await getAcknowledgementData();

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/evaluation-stats", async (req, res) => {
  try {
    const result = await getAllEvaluationStats();

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
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

    const heatmapStats = await getStatsForHeatmap();
    const categoricalScoreForAllSE = await getAverageScoreForAllSEPerCategory();
    const improvementScore = await getImprovementScorePerMonthAnnually();
    const leaderboardData = await getSELeaderboards();

    // ✅ Return Response
    res.json({
      totalSocialEnterprises: parseInt(totalSocialEnterprises[0].count),
      previousMonthSECount: parseInt(previousTotalSocialEnterprises[0].count),
      withMentorship: currentWithMentorshipCount,
      withoutMentorship: currentWithoutMentorshipCount,
      heatmapStats,
      categoricalScoreForAllSE,
      improvementScore,
      growthScoreTotal: currentGrowthScoreValue.toFixed(2), 
      cumulativeGrowth: cumulativeGrowthValue.toFixed(2),  
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
  const { id } = req.params;
  const updatedMentor = req.body;

  // console.log(" [server] Received update request for Mentor ID:", id);

  try {
    // console.log(" [mentors/id] Updating Mentor ID:", id, "\n");
    const result = await updateMentor(id, updatedMentor);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedRow = result.rows[0];
    // console.log(" [mentors/id] Mentor Updated!", updatedRow, "\n");
    res.json({ 
      message: "Mentor updated successfully", 
      user: { ...updatedRow, id: updatedRow.mentor_id } // ✅ Ensure frontend receives correct data
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentors/:mentorId/social-enterprises", async (req, res) => {
  const { mentorId } = req.params;

  try {
    const query = `
      SELECT se.se_id, se.team_name
      FROM socialenterprises se
      JOIN mentorships m ON se.se_id = m.se_id
      WHERE m.mentor_id = $1
    `;
    const result = await pgDatabase.query(query, [mentorId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function updateMentor(id, updatedMentor) {
  const { mentor_firstName, mentor_lastName, email, contactnum, isactive } = updatedMentor; // Modify based on your schema
  // console.log(" [updateMentor] Processing:", id, "\n");
  const query = `
    UPDATE users
    SET first_name = $1, last_name = $2, email = $3, contactnum = $4, isactive = $5
    WHERE user_id = $6
    RETURNING *;
  `;

  const values = [mentor_firstName, mentor_lastName, email, contactnum, isactive, id];

  try {
    const result = await pgDatabase.query(query, values);
    console.log("✅ Update Complete ", id);
    return result;
  } catch (error) {
    console.error("Database update error:", error);
    throw error;
  }
}


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
        INSERT INTO evaluations (mentor_id, se_id, created_at, "isAcknowledge", evaluation_type)
        VALUES ($1, $2, NOW(), false, 'Social Enterprise')
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
    let { programs } = req.body;

    if (!Array.isArray(programs) || programs.length === 0) {
      return res.status(400).json({ message: "Invalid request. Missing programs." });
    }

    // ✅ Fetch chat IDs along with associated SE IDs
    const chatIdResults = await getSocialEnterprisesUsersByProgram(programs);

    console.log("📡 Chat IDs Retrieved:", chatIdResults);

    if (!chatIdResults || chatIdResults.length === 0) {
      return res.status(404).json({ message: "No chat IDs found for the selected programs." });
    }

    // ✅ Fetch mentor details for each SE from the `mentorship` table
    for (const { chatId, seId } of chatIdResults) {
      const mentorDetails = await getMentorBySEID(seId); 

      if (!mentorDetails) {
        console.warn(`⚠️ No mentor found for SE: ${seId}, skipping evaluation.`);
        continue; // Skip if no mentor is assigned
      }

      console.log(`📨 Sending evaluation request to SE: ${seId} for Mentor: ${mentorDetails.name}`);

      // ✅ Send Start Evaluation Button
      const startEvaluationMessage = await sendStartMentorButton(
        chatId,
        `Start Evaluation for ${mentorDetails.name}`,
        mentorDetails.mentor_id // ✅ Use the correct mentor ID
      );

      // Store mentorId & seId in userStates when starting evaluation
      userStates[chatId] = {
        startEvaluationMessageId: startEvaluationMessage.message_id,
        mentorId: mentorDetails.mentor_id,  // ✅ Store the correct mentor ID
        seId,      // Capture the SE evaluating the mentor
      };
    }

    res.status(200).json({ message: "Evaluation messages sent." });
  } catch (error) {
    console.error("❌ INTERNAL SERVER ERROR:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// Example of a protected route
app.get("/protected", requireAuth, (req, res) => {
  res.json({ message: "Access granted to protected route" });
});

// Route to get all mentorship schedules
app.get("/api/mentorSchedules", async (req, res) => {
  try {
    const schedules = await getSchedulingHistory();
    res.json(schedules);
  } catch (error) {
    console.error("❌ Error fetching mentor schedules:", error);
    res.status(500).json({ error: "Failed to fetch mentor schedules" });
  }
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

app.get("/comparePerformanceScore/:se1/:se2", async (req, res) => {
  try {
    const { se1, se2 } = req.params; // Expecting SE IDs

    if (!se1 || !se2) {
      return res.status(400).json({ message: "Missing required SE IDs" });
    }

    console.log("Comparing SEs:", se1, se2);

    const result = await compareSocialEnterprisesPerformance(se1, se2);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No evaluation data found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getAllSocialEnterpriseswithMentorID", async (req, res) => {
  try {
    const { mentor_id } = req.query; // Extract mentor_id from query parameters

    const result = await getAllSocialEnterpriseswithMentorID(mentor_id); // Fetch SEs from DB
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

app.get("/getAllSocialEnterprisesForComparison", async (req, res) => {
  try {
    const result = await getAllSocialEnterprisesForComparison(); // Fetch SEs from DB
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

app.get("/getMentorEvaluationsBySEID", async (req, res) => {
  try {
    const { se_id } = req.query; // Extract se_id from query parameters

    if (!se_id) {
      return res.status(400).json({ message: "se_id is required" });
    }

    const result = await getEvaluationsBySEID(se_id); // Fetch SEs from DB
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No evaluations found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getMentorEvaluationsByMentorID", async (req, res) => {
  try {
    const { mentor_id } = req.query; // Extract se_id from query parameters

    if (!mentor_id) {
      return res.status(400).json({ message: "se_id is required" });
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

app.get("/getEvaluationDetailsForMentorEvaluation", async (req, res) => {
  try {
      const { evaluation_id } = req.query; // Extract evaluation_id from query parameters

      if (!evaluation_id) {
          return res.status(400).json({ message: "evaluation_id is required" });
      }

      const result = await getEvaluationDetailsForMentorEvaluation(evaluation_id); // Fetch evaluation details from DB

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
    // Capture the period from query params
    const period = req.query.period; 

    // Fetch the top SE performance based on the period
    const result = await getTopSEPerformance(period);

    // If no data is found
    if (result.length === 0) {
      return res.status(404).json({ message: "No performance data available" });
    }

    // Return the fetched data
    res.json(result);
  } catch (error) {
    console.error("Error fetching top SE performance:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/top-se-performance-with-mentorships", async (req, res) => {
  try {
    const { mentor_id } = req.query; // Extract mentor_id from query parameters

    // Capture the period from query params
    const period = req.query.period; 

    const result = await getTopSEPerformanceByMentorships(mentor_id, period);

    if (result.length === 0) {  // ✅ result is already an array
      return res.json({ message: "No performance data available" });
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching top SE performance:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentor-analytics/:mentor_id", async (req, res) => {
  try {
    const { mentor_id } = req.params;
    if (!mentor_id) return res.status(400).json({ message: "Mentor ID is required" });

    // Fetch mentor analytics data
    const mentorEvaluationCount = await getMentorEvaluationCount(mentor_id);
    const mentorAvgRating = await getMentorAvgRating(mentor_id);
    const mentorFrequentRating = await getMentorFrequentRating(mentor_id);
    const handledSEs = await getHandledSEsCountByMentor(mentor_id);
    const avgRatingPerCategory = await getAvgRatingForMentor(mentor_id);
    const performanceOverview = await getPerformanceOverviewForMentor(mentor_id);

    res.json({
      totalEvaluations: mentorEvaluationCount,
      avgRating: mentorAvgRating,
      mostFrequentRating: mentorFrequentRating,
      numHandledSEs: handledSEs,
      avgRatingPerCategory,
      performanceOverview
    });
  } catch (error) {
    console.error("❌ Error fetching mentor analytics stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/se-analytics-stats/:se_id", async (req, res) => {
  try {
    const { se_id } = req.params;
    if (!se_id) return res.status(400).json({ message: "SE ID is required" });

    const registeredUsers = await countTelegramUsers(se_id) || 0;
    const totalEvaluations = await getTotalEvaluationCount(se_id) || 0;
    const pendingEvaluations = await getPendingEvaluationCount(se_id) || 0;
    const acknowledgedEvaluations = await getAcknowledgedEvaluationCount(se_id) || 0;
    const avgRating = await avgRatingPerSE(se_id) || 0;

    res.json({ registeredUsers, totalEvaluations, pendingEvaluations, avgRating, acknowledgedEvaluations });
  } catch (error) {
    console.error("Error fetching SE analytics stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/single-se-performance/:se_id", async (req, res) => {
  try {
    const { se_id } = req.params;
    const period = req.query.period
    const result = await getPerformanceTrendBySEID(se_id, period);
    
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

app.post("/api/remove-mentorship", async (req, res) => {
  const { mentorId, seId } = req.body;

  if (!mentorId || !seId) {
    return res.status(400).json({ error: "Mentor ID and Social Enterprise ID are required." });
  }

  try {
    // Begin transaction
    await pgDatabase.query("BEGIN");

    // Delete mentorship record
    const deleteMentorship = `
      DELETE FROM mentorships 
      WHERE mentor_id = $1 AND se_id = $2
    `;
    const result = await pgDatabase.query(deleteMentorship, [mentorId, seId]);

    if (result.rowCount === 0) {
      await pgDatabase.query("ROLLBACK");
      return res.status(404).json({ error: "No mentorship record found." });
    }

    // Commit transaction
    await pgDatabase.query("COMMIT");

    res.json({ success: true, message: "Mentorship removed successfully!" });
  } catch (error) {
    await pgDatabase.query("ROLLBACK");
    console.error("❌ Error removing mentorship:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
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

app.get("/getProgramIdByName/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const result = await pgDatabase.query("SELECT program_id FROM programs WHERE name = $1", [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.json({ program_id: result.rows[0].program_id });
  } catch (error) {
    console.error("Error fetching program_id:", error);
    res.status(500).json({ message: "Error fetching program_id" });
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

// Fetch active mentors
app.get("/getAllEvaluations", async (req, res) => {
  try {
    const result = await getEvaluations();
    res.json(result);
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

app.put("/updateSocialEnterprise/:se_id", async (req, res) => {
  const { se_id } = req.params;
  const updatedData = req.body;
  
  try {
    const result = await updateSERowUpdate(se_id, updatedData);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Server error updating SE:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/heatmap-stats", async (req, res) => {
  try {
    const { period } = req.query; // Get period from query params
    const result = await getStatsForHeatmap(period);

    res.json(result);
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//For Testing only
app.get("/api-test", async (req, res) => {
  try {
    const result = await getImprovementScorePerMonthAnnually()

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
      
          // ✅ Fetch a single mentor instead of expecting an array
          const mentor = await getMentorBySEID(enterpriseId);
      
          if (!mentor) {
              await sendMessage(chatId, `⚠️ No mentors available under *${selectedEnterprise.team_name}*.`);
              return res.sendStatus(200);
          }
      
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
          await deletePreviousMessages(chatId, ["sendAcknowledgeButtonId"]);
      
          try {
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

        if (data.startsWith("acceptschedule_")) {
          const parts = data.split("_");
      
          await deletePreviousMessages(chatId, ["sentMessageScheduleId"]);
      
          if (parts.length < 2) {
              console.error("❌ Invalid accept callback format:", data);
              return res.sendStatus(400);
          }
      
          const mentoring_session_id = parts[1]; // Use mentoring_session_id instead of mentorship_id
          const messageId = callbackQuery.message.message_id;
      
          console.log(`🔹 Accepting mentoring session ${mentoring_session_id}`);
          console.log(`📌 Chat ID: ${chatId}, Message ID: ${messageId}`);
      
          try {
              // ✅ Step 1: Validate UUID format
              if (!/^[0-9a-fA-F-]{36}$/.test(mentoring_session_id)) {
                  console.error(`❌ Invalid mentoring_session_id format: ${mentoring_session_id}`);
                  return res.sendStatus(400);
              }
      
              // ✅ Step 2: Fetch mentoring session details
              const result = await pgDatabase.query(
                  `SELECT ms.mentoring_session_id, m.mentorship_id, se.team_name, 
                          CONCAT(mt.mentor_firstname, ' ', mt.mentor_lastname) AS mentor_name,
                          p.name AS program_name,
                          TO_CHAR(ms.mentoring_session_date, 'FMMonth DD, YYYY') AS mentoring_session_date,
                          CONCAT(TO_CHAR(ms.start_time, 'HH24:MI'), ' - ', TO_CHAR(ms.end_time, 'HH24:MI')) AS mentoring_session_time,
                          ms.status, ms.zoom_link
                   FROM mentorships m
                   JOIN mentoring_session ms ON m.mentorship_id = ms.mentorship_id
                   JOIN mentors mt ON m.mentor_id = mt.mentor_id
                   JOIN socialenterprises se ON m.se_id = se.se_id
                   JOIN programs p ON p.program_id = se.program_id
                   WHERE ms.mentoring_session_id = $1`,
                  [mentoring_session_id]
              );
      
              if (result.rows.length === 0) {
                  console.warn(`⚠️ No mentoring session found for ID ${mentoring_session_id}`);
                  return res.sendStatus(404);
              }
      
              const sessionDetails = result.rows[0];
              console.log(`🔍 Found Mentoring Session:`, sessionDetails);
      
              // ✅ Step 4: Update mentoring session status
              await pgDatabase.query(
                  `UPDATE mentoring_session SET status = 'Accepted' WHERE mentoring_session_id = $1`,
                  [mentoring_session_id]
              );
      
              // ✅ Step 5: Send confirmation message with details
              const confirmationMessage = `📅 *Confirmed Mentoring Session*\n\n` +
                  `🔹 *Date:* ${sessionDetails.mentoring_session_date}\n` +
                  `🔹 *Time:* ${sessionDetails.mentoring_session_time}\n` +
                  `🔹 *Mentor:* ${sessionDetails.mentor_name}\n` +
                  `🔹 *Team:* ${sessionDetails.team_name}\n` +
                  `📹 *Zoom Link:* ${sessionDetails.zoom_link || 'No Zoom link provided'}`;
      
              await sendMessage(chatId, confirmationMessage);
              console.log("✅ Acceptance process completed successfully.");
      
              res.sendStatus(200);
              return;
          } catch (error) {
              console.error("❌ Error handling acceptance:", error);
              console.log("🛑 Error Stack:", error.stack);
              await sendMessage(chatId, "❌ Failed to process acceptance.");
              return res.sendStatus(500);
          }
        }
      
        
        if (data.startsWith("declineschedule_")) {
            const parts = data.split("_");
        
            await deletePreviousMessages(chatId, ["sentMessageScheduleId"]);
        
            if (parts.length < 2) {
                console.error("❌ Invalid decline callback format:", data);
                return res.sendStatus(400);
            }
        
            const mentoring_session_id = parts[1]; // Use mentoring_session_id instead of mentorship_id
            const messageId = callbackQuery.message.message_id;
        
            console.log(`🔹 Declining mentoring session ${mentoring_session_id}`);
            console.log(`📌 Chat ID: ${chatId}, Message ID: ${messageId}`);
        
            try {
                // ✅ Step 1: Validate UUID format
                if (!/^[0-9a-fA-F-]{36}$/.test(mentoring_session_id)) {
                    console.error(`❌ Invalid mentoring_session_id format: ${mentoring_session_id}`);
                    return res.sendStatus(400);
                }
        
                // ✅ Step 2: Fetch mentoring session details
                const result = await pgDatabase.query(
                    `SELECT ms.mentoring_session_id, m.mentorship_id, se.team_name, 
                            CONCAT(mt.mentor_firstname, ' ', mt.mentor_lastname) AS mentor_name,
                            p.name AS program_name,
                            TO_CHAR(ms.mentoring_session_date, 'FMMonth DD, YYYY') AS mentoring_session_date,
                            CONCAT(TO_CHAR(ms.start_time, 'HH24:MI'), ' - ', TO_CHAR(ms.end_time, 'HH24:MI')) AS mentoring_session_time,
                            ms.status, ms.zoom_link
                    FROM mentorships m
                    JOIN mentoring_session ms ON m.mentorship_id = ms.mentorship_id
                    JOIN mentors mt ON m.mentor_id = mt.mentor_id
                    JOIN socialenterprises se ON m.se_id = se.se_id
                    JOIN programs p ON p.program_id = se.program_id
                    WHERE ms.mentoring_session_id = $1`,
                    [mentoring_session_id]
                );
        
                if (result.rows.length === 0) {
                    console.warn(`⚠️ No mentoring session found for ID ${mentoring_session_id}`);
                    return res.sendStatus(404);
                }
        
                const sessionDetails = result.rows[0];
                console.log(`🔍 Found Mentoring Session:`, sessionDetails);
        
                // ✅ Step 4: Update mentoring session status to "Declined"
                await pgDatabase.query(
                    `UPDATE mentoring_session SET status = 'Declined' WHERE mentoring_session_id = $1`,
                    [mentoring_session_id]
                );
        
                // ✅ Step 5: Send decline confirmation message with details
                const declineMessage = `⚠️ *Mentoring Session Declined*\n\n` +
                    `🔹 *Date:* ${sessionDetails.mentoring_session_date}\n` +
                    `🔹 *Time:* ${sessionDetails.mentoring_session_time}\n` +
                    `🔹 *Mentor:* ${sessionDetails.mentor_name}\n` +
                    `🔹 *Team:* ${sessionDetails.team_name}\n` +
                    `📹 *Zoom Link:* ${sessionDetails.zoom_link || 'No Zoom link provided'}`;
        
                await sendMessage(chatId, declineMessage);
                console.log("✅ Decline process completed successfully.");
        
                res.sendStatus(200);
                return;
            } catch (error) {
                console.error("❌ Error handling decline:", error);
                console.log("🛑 Error Stack:", error.stack);
                await sendMessage(chatId, "❌ Failed to process decline.");
                return res.sendStatus(500);
            }
        }
        
        if (data.startsWith("mentoreval_")) {
          await deletePreviousMessages(chatId, ["startEvaluationMessageId"]);
          try {
            const mentorEvalID = data.replace("mentoreval_", "");
        
            // Retrieve mentorId and seId from stored state
            const { mentorId, seId } = userStates[chatId] || {};
        
            if (!mentorId || !seId) {
              console.error("❌ Error: Missing mentorId or SE ID for evaluation.");
              return res.status(400).json({ message: "Mentor or SE ID missing" });
            }
        
            // Store evaluation progress
            userStates[chatId] = {
              type: "mentorEvaluation",
              mentorEvalID,
              mentorId,
              seId,
              currentQuestionIndex: 0,
              responses: {},
              questionMessageIds: [], // ✅ Initialize array to store message IDs
            };
        
            // ✅ Load mentor evaluation questions from the database
            userStates[chatId].questions = await getMentorQuestions();
        
            // ✅ Send the first question directly
            if (userStates[chatId].questions.length > 0) {
              const firstQuestion = userStates[chatId].questions[0];
        
              const options = [
                [
                  { text: "1️⃣ - Strongly Disagree", callback_data: "mentorans_1" },
                  { text: "2️⃣ - Disagree", callback_data: "mentorans_2" },
                ],
                [
                  { text: "3️⃣ - Neutral", callback_data: "mentorans_3" },
                  { text: "4️⃣ - Agree", callback_data: "mentorans_4" },
                ],
                [
                  { text: "5️⃣ - Strongly Agree", callback_data: "mentorans_5" },
                ],
              ];
        
              const firstQuestionMessage = await sendMessageWithOptions(
                chatId,
                `📢 *Question 1:* ${firstQuestion.question_text}\n\n(Select a rating from 1 to 5)`,
                options
              );
        
              // ✅ Store the first question's message ID in the array
              userStates[chatId].questionMessageIds.push(firstQuestionMessage.message_id);
            } else {
              console.error("❌ No mentor evaluation questions found!");
              await sendMessage(chatId, "❌ No evaluation questions available.");
            }
        
            return res.sendStatus(200);
          } catch (error) {
            console.error("❌ Error acknowledging evaluation:", error);
            await sendMessage(chatId, "❌ Failed to start evaluation. Please try again.");
            return res.sendStatus(500);
          }
        }
        
        if (data.startsWith("mentorans_")) {
          try {
            const rating = parseInt(data.replace("mentorans_", ""));
            const userState = userStates[chatId];
        
            if (!userState || userState.type !== "mentorEvaluation") {
              return res.sendStatus(400);
            }
        
            // Ensure questions are loaded
            if (!userState.questions || userState.questions.length === 0) {
              userState.questions = await getMentorQuestions();
            }
        
            // Get the current question
            const currentQuestion = userState.questions[userState.currentQuestionIndex];
        
            // Store the response
            userState.responses[currentQuestion.category] = {
              rating,
              comments: "", // Can be extended later
            };
        
            // Move to the next question
            userState.currentQuestionIndex++;
        
            // ✅ Check if there are more questions
            if (userState.currentQuestionIndex < userState.questions.length) {
              const nextQuestion = userState.questions[userState.currentQuestionIndex];
        
              const options = [
                [
                  { text: "1️⃣ - Strongly Disagree", callback_data: "mentorans_1" },
                  { text: "2️⃣ - Disagree", callback_data: "mentorans_2" },
                ],
                [
                  { text: "3️⃣ - Neutral", callback_data: "mentorans_3" },
                  { text: "4️⃣ - Agree", callback_data: "mentorans_4" },
                ],
                [
                  { text: "5️⃣ - Strongly Agree", callback_data: "mentorans_5" },
                ],
              ];
        
              // ✅ Send the next question
              const nextQuestionMessage = await sendMessageWithOptions(
                chatId,
                `📢 *Question ${userState.currentQuestionIndex + 1}:* ${nextQuestion.question_text}\n\n(Select a rating from 1 to 5)`,
                options
              );
        
              // ✅ Store and delete the previous question properly
              await storeAndDeletePreviousQuestion(chatId, nextQuestionMessage.message_id);
            } else {
              // ✅ Last question reached, delete its message before submitting evaluation
              await storeAndDeletePreviousQuestion(chatId, null, true);
        
              // ✅ All questions answered → Submit evaluation
              await submitMentorEvaluation(chatId, userState.responses);
              delete userStates[chatId]; // Clear user state
            }
        
            return res.sendStatus(200);
          } catch (error) {
            console.error("❌ Error processing mentor evaluation:", error);
            await sendMessage(chatId, "❌ Failed to process evaluation. Please try again.");
            return res.sendStatus(500);
          }
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
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/approveMentorship", async (req, res) => {
  const { mentoring_session_id, mentorship_id, mentorship_date, mentorship_time, zoom_link } = req.body;

  console.log("Date: ", mentorship_date)
  console.log("Time: ", mentorship_time)
  console.log("Zoom: ", zoom_link)

  try {
    const query = `
      UPDATE mentoring_session
      SET status = 'Pending SE'  -- Change this to the desired status
      WHERE mentoring_session_id = $1
      RETURNING *;
    `;

    const { rows } = await pgDatabase.query(query, [mentoring_session_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mentorship not found" });
    }

    // Retrieve chat IDs for the mentorship
    const chatQuery = `
        SELECT se.chatid AS chatid
        FROM telegrambot AS mentor
        JOIN mentorships ON mentorships.mentor_id = mentor.mentor_id
        JOIN telegrambot AS se ON mentorships.se_id = se."se_ID"  
        WHERE mentorships.mentorship_id = $1;
    `;

    const chatResult = await pgDatabase.query(chatQuery, [mentorship_id]);

    if (chatResult.rows.length > 0) {
      console.log(`📩 Sending Mentorship Message to ${chatResult.rows.length} Chat IDs`);

      // Loop through all chat IDs and send the message
      for (const row of chatResult.rows) {
        const chatId = row.chatid;

        console.log(`📤 Sending Mentorship Message to Chat ID: ${chatId}`);

        // Send the mentorship invitation
        sendMentorshipMessage(chatId, mentoring_session_id, mentorship_id, mentorship_date, mentorship_time, zoom_link);
      }
    } else {
      console.warn(`⚠️ No chat IDs found for mentorship ${mentorship_id}`);
    }
        
    res.json({ message: "Mentorship approved", mentorship: rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/declineMentorship", async (req, res) => {
  const { mentoring_session_id } = req.body;

  console.log("Declining mentorship with ID:", mentoring_session_id);

  try {
    const query = `
      UPDATE mentoring_session
      SET status = 'Declined'  -- Use 'Declined' instead of 'Decline'
      WHERE mentoring_session_id = $1
      RETURNING *;
    `;

    const { rows } = await pgDatabase.query(query, [mentoring_session_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mentorship session not found" });
    }

    res.json({ message: "Mentorship declined", mentorship: rows[0] });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/updateMentorshipDate", async (req, res) => {
  console.log("🔹 Received request at /updateMentorshipDate");

  let { mentorship_id, mentoring_session_date, start_time, end_time, zoom_link } = req.body;

  if (!mentorship_id || !mentoring_session_date || !start_time || !end_time) {
    return res.status(400).json({ error: "Mentorship ID, date, start time, and end time are required" });
  }

  // Convert times to full timestamp format
  start_time = `${mentoring_session_date} ${start_time}:00`;
  end_time = `${mentoring_session_date} ${end_time}:00`;

  console.log("📌 Mentorship ID:", mentorship_id);
  console.log("📅 Date:", mentoring_session_date);
  console.log("⏰ Start Time:", start_time);
  console.log("⏳ End Time:", end_time);
  console.log("🔗 Zoom Link:", zoom_link);

  try {
    const query = `
      INSERT INTO mentoring_session (
          start_time,
          end_time,
          zoom_link,
          mentoring_session_date,
          mentorship_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const { rows } = await pgDatabase.query(query, [
      start_time,
      end_time,
      zoom_link,
      mentoring_session_date,
      mentorship_id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Mentorship not found" });
    }

    console.log(`✅ Mentorship ${mentorship_id} scheduled successfully.`);
    res.json({ message: "Mentorship date updated", mentorship: rows[0] });
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getMentorshipDates", async (req, res) => {
  const { mentor_id } = req.query;
  // console.log("server/getMentorshipDate: mentor_id: ", mentor_id);

  try {

    const query = `
          SELECT 
              ms.mentoring_session_id,
              m.mentorship_id, 
              se.team_name, 
              CONCAT(mt.mentor_firstname, ' ', mt.mentor_lastname) AS mentor_name,
              p.name AS program_name,
              ms.mentoring_session_date,
              CONCAT(
                to_char(ms.start_time, 'HH24:MI'), ' - ', 
                to_char(ms.end_time, 'HH24:MI')
              ) AS mentoring_session_time,
              ms.status,
              ms.zoom_link
          FROM mentorships m
          JOIN mentoring_session ms ON m.mentorship_id = ms.mentorship_id
          JOIN mentors mt ON m.mentor_id = mt.mentor_id
          JOIN socialenterprises se ON m.se_id = se.se_id
          JOIN programs p ON p.program_id = se.program_id
          WHERE m.mentor_id = $1
          ORDER BY ms.mentoring_session_date, ms.start_time;
    `;

    const result = await pgDatabase.query(query, [mentor_id]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching mentorship dates:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/updateMentorshipZoomLink", async (req, res) => {
  try {
    const { mentorship_id, zoom_link } = req.body;

    if (!mentorship_id || !zoom_link) {
      return res.status(400).json({ message: "Mentorship ID and Zoom link are required" });
    }

    const query = `
      UPDATE public.mentorships
      SET zoom_link = $1
      WHERE mentorship_id = $2
      RETURNING *;
    `;

    const result = await pgDatabase.query(query, [zoom_link, mentorship_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Mentorship not found" });
    }

    res.status(200).json({ message: "Zoom link updated successfully", mentorship: result.rows[0] });
  } catch (error) {
    console.error("❌ Error updating Zoom link:", error);
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
