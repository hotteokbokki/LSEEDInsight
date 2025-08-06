const express = require("express");
const session = require("express-session");
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt'); // For password hashing
const cron = require('node-cron'); // For automating password changing
const crypto = require('crypto'); // FOr generating passwords for sign up
const { router: authRoutes, requireAuth } = require("./routes/authRoutes");
const axios = require("axios");
const path = require('path');
const ngrok = require("ngrok"); // Exposes your local server to the internet
const { getPrograms, getProgramNameByID, getProgramCount, getProgramsForTelegram, getAllPrograms } = require("./controllers/programsController");
const { getTelegramUsers, insertTelegramUser, getSocialEnterprisesUsersByProgram, countTelegramUsers, checkTelegramBotTable } = require("./controllers/telegrambotController");
const { getSocialEnterprisesByProgram,
  getSocialEnterpriseByID,
  getAllSocialEnterprises,
  getAllSocialEnterprisesWithMentorship,
  getTotalSECount,
  getSEWithOutMentors,
  getPreviousTotalSECount,
  getAllSocialEnterpriseswithMentorID,
  updateSERowUpdate,
  getAllSocialEnterprisesForComparison,
  getFlaggedSEs,
  getAreasOfFocus,
  getSuggestedMentors,
  getAcceptedApplications } = require("./controllers/socialenterprisesController");
require("dotenv").config();
const { getUsers, getUserName, getLSEEDCoordinators, getLSEEDDirectors } = require("./controllers/usersController");
const pgDatabase = require("./database.js"); // Import PostgreSQL client
const pgSession = require("connect-pg-simple")(session);
const cookieParser = require("cookie-parser");
const { addProgram } = require("./controllers/programsController");
const profileRoutes = require("./routes/profileRoutes.js");
const PDFDocument = require("pdfkit");

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
  getMentorCount,
  getCriticalAreasByMentorID,
  getAllMentorsWithMentorships } = require("./controllers/mentorsController.js");
const { getAllSDG } = require("./controllers/sdgController.js");
const { getMentorshipsByMentorId,
  getMentorBySEID,
  getSEWithMentors,
  getMentorshipCount,
  getPendingSchedules,
  getSchedulingHistory,
  getHandledSEsCountByMentor,
  getMentorshipsForScheduling,
  getSchedulingHistoryByMentorID,
  getMentorshipCountByMentorID,
  getPendingSchedulesForMentor,
  getProgramCoordinatorsByMentorshipID,
  getSuggestedCollaborations,
  getCollaborators,
} = require("./controllers/mentorshipsController.js");
const { addSocialEnterprise } = require("./controllers/socialenterprisesController");
const { getEvaluationsByMentorID,
  getEvaluationDetails,
  getTopSEPerformance,
  getCommonChallengesBySEID,
  getPermanceScoreBySEID,
  getAverageScoreForAllSEPerCategory,
  getImprovementScorePerMonthAnnually,
  getGrowthScoreOverallAnually,
  getMonthlyGrowthDetails,
  getSELeaderboards,
  updateAcknowledgeEvaluation,
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
  getEvaluationDetailsForMentorEvaluation,
  getEvaluationsMadeByMentor,
  getAllMentorTypeEvaluations,
  getRecentEvaluationsMadeByMentor,
  getEvaluationSubmittedCount } = require("./controllers/evaluationsController.js");
const { getActiveMentors } = require("./controllers/mentorsController");
const { getSocialEnterprisesWithoutMentor } = require("./controllers/socialenterprisesController");
const { updateSocialEnterpriseStatus } = require("./controllers/socialenterprisesController");
const { getPerformanceOverviewBySEID, getEvaluationScoreDistribution, compareSocialEnterprisesPerformance, getMentorAvgRating, getMentorFrequentRating, getAvgRatingForMentor, getPerformanceOverviewForMentor, getAvgRatingGivenByMentor, getCommonRatingGiven } = require("./controllers/evaluationcategoriesController.js");
const { getMentorQuestions } = require("./controllers/mentorEvaluationsQuestionsController.js");
const { getPreDefinedComments } = require("./controllers/predefinedcommentsController.js");
const { getUpcomingSchedulesForMentor, getMentorsByMentoringSessionID } = require("./controllers/mentoringSessionController.js");
const mentorshipRoutes = require("./routes/mentorships");
const cashflowRoutes = require("./routes/cashflowRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const { getProgramCoordinators,
  getProgramAssignment,
  assignProgramCoordinator } = require("./controllers/programAssignmentController.js");
const { getApplicationList } = require("./controllers/menteesFormSubmissionsController.js");
const { getMentorFormApplications } = require("./controllers/mentorFormApplicationController.js");
const { getSignUpPassword } = require("./controllers/signuppasswordsController.js");
const { getAuditLogs } = require("./controllers/auditlogsController.js");
const { requestCollaborationInsert, getExistingCollaborations, getCollaborationRequests, getCollaborationRequestDetails, insertCollaboration } = require("./controllers/mentorshipcollaborationController.js");
const app = express();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
const inviteToken = uuidv4();

const allowedOrigin = process.env.NODE_ENV === 'production'
  ? process.env.PROD_CORS_URL
  : process.env.DEV_CORS_URL;

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));


app.use(cookieParser());

// Set size limits BEFORE any routes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.set('trust proxy', 1);

// Session Configuration
app.use(session({
  store: new pgSession({
    pool: pgDatabase,
    tableName: "session",
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',     // true if HTTPS only in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // none only in production
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

// API Routes
//TODO
app.use("/api/cashflow", cashflowRoutes);
app.use("/api/inventory-distribution", inventoryRoutes);
app.use("/auth", authRoutes);
app.use("/api/mentorships", mentorshipRoutes);
app.use("/api/profile", requireAuth, profileRoutes);

app.post("/api/import/:reportType", async (req, res) => {
  const { reportType } = req.params;
  const data = req.body.data; // expects { data: [...], se_id: ..., user_id: ... }
  const seId = req.body.se_id;
  const userId = req.session.user?.id;

  console.log("====== IMPORT DEBUG ======");
  console.log("Session:", req.session);
  console.log("User ID:", userId);
  console.log("SE ID:", seId);
  console.log("Report Type:", reportType);
  console.log("Data keys:", data.length > 0 ? Object.keys(data[0]) : []);
  console.log("First row preview:", data[0]);


  if (!userId || !seId || !Array.isArray(data)) {
    return res.status(400).json({ message: "Missing required information" });
  }

  try {
    const insertFunctions = {
      financial_statements: async (row) =>
        await pgDatabase.query(
          `INSERT INTO financial_statements (se_id, entered_by, date, total_revenue, total_expenses, net_income, total_assets, total_liabilities, owner_equity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [seId, userId, row.date, row.total_revenue, row.total_expenses, row.net_income, row.total_assets, row.total_liabilities, row.owner_equity]
        ),

      inventory_report: async (row) =>
        await pgDatabase.query(
          `INSERT INTO inventory_report (se_id, entered_by, item_name, qty, price, amount)
       VALUES ($1, $2, $3, $4, $5, $6)`,
          [seId, userId, row.item_name, row.qty, row.price, row.amount]
        ),

      cash_in: async (row) =>
        await pgDatabase.query(
          `INSERT INTO cash_in (se_id, "enteredBy", date, sales, "otherRevenue", assets, liability, "ownerCapital", notes, cash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [seId, userId, row.date, row.sales, row.otherRevenue, row.assets, row.liability, row.ownerCapital, row.notes, row.cash]
        ),

      cash_out: async (row) =>
        await pgDatabase.query(
          `INSERT INTO cash_out (se_id, "enteredBy", date, cash, expenses, assets, inventory, liability, "ownerWithdrawal", notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [seId, userId, row.date, row.cash, row.expenses, row.assets, row.inventory, row.liability, row.ownerWithdrawal, row.notes]
        ),
    };

    const insertFn = insertFunctions[reportType];
    if (!insertFn) {
      return res.status(400).json({ message: "Unsupported report type" });
    }

    for (const row of data) {
      if (!isNaN(row.date)) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel starts from Dec 30, 1899
        const convertedDate = new Date(excelEpoch.getTime() + row.date * 86400000);
        row.date = convertedDate.toISOString().slice(0, 10); // Format to 'YYYY-MM-DD'
      }
      await insertFn(row);
    }

    return res.status(200).json({ message: "Data imported successfully" });
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Temporary storage for user states
const userStates = {};
// Timeout duration (in milliseconds) before clearing stale states
const STATE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const userSelections = {}; // Store selections temporarily before final save

const extractEmails = (text) => {
  return text?.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
};

const extractPhoneNumbers = (text) => {
  return text?.match(/(?:\+?\d{1,4}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g) || [];
};

function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

cron.schedule('0 8 * * 1', async () => {
  const newPassword = generateRandomPassword(16);
  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setDate(validFrom.getDate() + 7); // Valid for 7 days

  try {
    // Step 1: Delete all previous passwords
    await pgDatabase.query(`DELETE FROM signup_passwords;`);

    // Step 2: Insert new password
    await pgDatabase.query(`
      INSERT INTO signup_passwords (password, valid_from, valid_until)
      VALUES ($1, $2, $3)
    `, [newPassword, validFrom, validUntil]);

    console.log(`✅ New signup password generated: ${newPassword}`);
  } catch (err) {
    console.error('❌ Error rotating signup password:', err);
  }
});

cron.schedule('0 3 * * *', async () => {
  // runs daily at 3AM
  await pool.query(
    'DELETE FROM coordinator_invites WHERE expires_at <= NOW()'
  );
});

cron.schedule('* * * * *', async () => {

  try {
    // 1. Auto-decline Pending SE sessions that are overdue
    await pgDatabase.query(`
      UPDATE mentoring_session
      SET status = 'Declined'
      WHERE status IN ('Pending SE', 'Pending')
        AND start_time < NOW()
    `);

    // 2. Move Accepted sessions to In Progress
    await pgDatabase.query(`
      UPDATE mentoring_session
      SET status = 'In Progress'
      WHERE status = 'Accepted'
        AND start_time <= NOW()
        AND end_time > NOW()
    `);

    // 3. Move Accepted or In Progress sessions to Completed
    await pgDatabase.query(`
      UPDATE mentoring_session
      SET status = 'Completed'
      WHERE status IN ('Accepted', 'In Progress')
        AND end_time <= NOW()
    `);

  } catch (err) {
    console.error('❌ Error updating mentoring session statuses:', err);
  }
});

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

function generateDynamicOutlook({
  netIncome,
  totalAssets,
  transformedCashFlowData,
  selectedSEEquityTrendData,
  inventoryTurnoverByItemData,
  netProfitMargin,
  grossProfitMargin,
  debtToAssetRatio,
}) {
  const outlook = [];

  // 1. Net Income
  if (typeof netIncome === "number") {
    if (netIncome > 0) {
      outlook.push("Net income is positive, indicating financial viability.");
    } else if (netIncome < 0) {
      outlook.push("Net income is negative, suggesting operational or revenue challenges.");
    }
  }

  // 2. Asset Utilization
  if (typeof netIncome === "number" && typeof totalAssets === "number" && totalAssets > 0) {
    const roa = netIncome / totalAssets;
    if (roa >= 0.1) {
      outlook.push("Assets are generating strong returns, reflecting efficient utilization.");
    } else if (roa >= 0.05) {
      outlook.push("Asset utilization is moderate but acceptable.");
    } else {
      outlook.push("Assets are underperforming — explore ways to optimize usage.");
    }
  }

  // 3. Cashflow Balance & Volatility
  if (Array.isArray(transformedCashFlowData) && transformedCashFlowData.length > 1) {
    const inflows = transformedCashFlowData.map(q => q.Inflow).filter(i => i > 0);
    const outflows = transformedCashFlowData.map(q => q.Outflow).filter(o => o > 0);
    if (inflows.length && outflows.length) {
      const avgInflow = inflows.reduce((a, b) => a + b, 0) / inflows.length;
      const avgOutflow = outflows.reduce((a, b) => a + b, 0) / outflows.length;
      if (avgInflow > avgOutflow) {
        outlook.push("Cash inflows exceed outflows, suggesting a healthy cash position.");
      } else if (avgInflow < avgOutflow) {
        outlook.push("Cash outflows consistently exceed inflows — liquidity pressure is present.");
      } else {
        outlook.push("Cash inflows and outflows are balanced, but margin for error is slim.");
      }
    }
  }

  // 4. Equity Stability
  const equityData = selectedSEEquityTrendData?.[0]?.data || [];
  if (equityData.length >= 2) {
    const values = equityData.map(e => e.y);
    const start = values[0];
    const end = values[values.length - 1];
    if (new Set(values).size === 1) {
      outlook.push("Equity has remained stable over time.");
    } else if (end > start) {
      outlook.push("Equity has grown over time — value retention is improving.");
    } else {
      outlook.push("Equity has declined — net worth erosion is a concern.");
    }
  }

  // 5. Inventory Turnover
  if (Array.isArray(inventoryTurnoverByItemData) && inventoryTurnoverByItemData.length > 0) {
    const turnoverRates = inventoryTurnoverByItemData.map(i => i.turnover);
    const avg = turnoverRates.reduce((a, b) => a + b, 0) / turnoverRates.length;
    const high = inventoryTurnoverByItemData.filter(i => i.turnover > avg * 1.25);
    const low = inventoryTurnoverByItemData.filter(i => i.turnover < avg * 0.75);

    if (high.length && !low.length) {
      outlook.push("Inventory turnover is generally high — indicating strong sales and low excess stock.");
    } else if (low.length && !high.length) {
      outlook.push("Inventory turnover is generally low — review product movement and storage costs.");
    } else if (high.length && low.length) {
      outlook.push("Mixed turnover patterns in inventory — consider rebalancing fast and slow-moving items.");
    } else {
      outlook.push("Inventory turnover is consistent across products.");
    }
  }

  // 6. Net Profit Margin
  if (typeof netProfitMargin === "string") {
    if (netProfitMargin > 0.2) {
      outlook.push("High net profit margin suggests efficient operations and pricing.");
    } else if (netProfitMargin >= 0.1) {
      outlook.push("Moderate net profit margin — decent profitability with room for improvement.");
    } else {
      outlook.push("Low net profit margin — tighten cost controls or revisit pricing strategies.");
    }
  } else {
    outlook.push("• Net Profit Margin: Data unavailable");
  }

  // 7. Gross Profit Margin
  if (typeof grossProfitMargin === "string") {
    if (grossProfitMargin > 0.6) {
      outlook.push("Excellent gross margin — production/sourcing costs are well managed.");
    } else if (grossProfitMargin >= 0.4) {
      outlook.push("Healthy gross margin — core operations are profitable.");
    } else {
      outlook.push("Low gross margin — consider sourcing and production cost optimizations.");
    }
  } else {
    outlook.push("• Gross Profit Margin: Data unavailable");
  }

  // 8. Debt-to-Asset Ratio
  if (typeof debtToAssetRatio === "string") {
    if (debtToAssetRatio > 0.6) {
      outlook.push("High debt-to-asset ratio — financial leverage is elevated, monitor repayment capacity.");
    } else if (debtToAssetRatio >= 0.3) {
      outlook.push("Moderate debt-to-asset ratio — debt is within manageable range.");
    } else {
      outlook.push("Low debt-to-asset ratio — minimal risk from external liabilities.");
    }
  } else {
    outlook.push("• Debt-to-Asset Ratio: Data unavailable");
  }

  return outlook;
}

function extractEmailFromContactnum(contactnum) {
  if (!contactnum) return "";

  // Split into parts by "/"
  const parts = contactnum.split("/").map(p => p.trim());

  // Look for the part that has an "@"
  for (const part of parts) {
    if (part.includes("@")) {
      return part;
    }
  }

  // Fallback if no email found
  return "";
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

async function sendMentorshipMessage(
  chatId,
  mentoring_session_id,
  mentorship_id,
  mentorship_date,
  mentorship_time,
  zoom_link,
  mentorFirstName,
  mentorLastName
) {
  console.log(`📩 Sending Mentorship Schedule Message to Chat ID: ${chatId}`);

  // Ensure it's an array for consistent handling
  if (!Array.isArray(mentorship_date)) {
    mentorship_date = [mentorship_date];
  }

  const mentorName = `${mentorFirstName} ${mentorLastName}`;

  // ✅ Format mentorship date
  let formattedDate;

  try {
    const rawString = mentorship_date[0];

    // Extract only the part before the comma after the year (e.g. "June 17, 2025")
    const match = rawString.match(/^([A-Za-z]+ \d{1,2}, \d{4})/);
    const cleanDate = match ? match[1] : null;

    if (!cleanDate) {
      console.error("❌ Could not extract clean date from:", rawString);
      formattedDate = "Invalid Date";
    } else {
      const date = new Date(cleanDate);
      if (isNaN(date.getTime())) {
        console.error("❌ Could not parse date:", cleanDate);
        formattedDate = "Invalid Date";
      } else {
        formattedDate = date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
    }
  } catch (err) {
    console.error("❌ Date formatting error:", err);
    formattedDate = "Invalid Date";
  }

  const message = `📅 *New Mentorship Meeting Request*\n\n`
    + `🔹 *Mentor:* ${mentorName}\n`
    + `🔹 *Date:* ${formattedDate}\n`
    + `🔹 *Time:* ${mentorship_time}\n`
    + `🔹 *Zoom Link:* ${zoom_link || "N/A"}\n\n`
    + `📌 Please confirm your availability:`;

  // Inline keyboard for Accept/Decline
  const options = [
    [
      { text: `✅ Accept`, callback_data: `acceptschedule_${mentoring_session_id}` },
      { text: `❌ Decline`, callback_data: `declineschedule_${mentoring_session_id}` }
    ]
  ];

  const sentMessageSchedule = await sendMessageWithOptions(chatId, message, options);

  userStates[chatId] = { sentMessageScheduleId: sentMessageSchedule?.message_id };

  if (sentMessageSchedule) {
    console.log("✅ Mentorship message sent with buttons:", sentMessageSchedule);
  } else {
    console.error("❌ Failed to send mentorship message.");
  }
}

function formatTimeLabel(time24) {
  const [hoursStr, minutesStr] = time24.split(":");
  let hours = parseInt(hoursStr, 10);
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutesStr} ${suffix}`;
}

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = `
      SELECT
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.password, -- We need the password hash for comparison
          u.isactive,
          ARRAY_AGG(uhr.role_name) AS roles
      FROM
          users u
      LEFT JOIN
          user_has_roles uhr ON u.user_id = uhr.user_id
      WHERE
          u.email = $1
      GROUP BY
          u.user_id, u.first_name, u.last_name, u.email, u.password, u.isactive;
    `;

    // Place the full query string here
    const result = await pgDatabase.query(
      query,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isactive) {
      return res.status(403).json({
        message:
          "Your account is pending verification. Please wait for LSEED to verify your account.",
      });
    }

    // Clean up the roles array from [null] to []
    const cleanedRoles = user.roles && user.roles.length > 0 && user.roles[0] !== null
      ? user.roles
      : [];

    // Store user info in session
    req.session.user = {
      id: user.user_id,
      email: user.email,
      roles: cleanedRoles,
      firstName: user.first_name,
      lastName: user.last_name,
      activeRole: user.roles[0],
    };
    req.session.isAuth = true;

    console.log("Login Session:", req.session);

    // Respond appropriately
    if (cleanedRoles.includes("Administrator")) { // Use .includes() for array check
      return res.json({
        message: "Admin login successful",
        user: {
          id: user.user_id,
          email: user.email,
          roles: cleanedRoles,
        },
        session_id: req.sessionID,
        redirect: "/admin",
      });
    } else {
      return res.json({
        message: "User login successful",
        user: {
          id: user.user_id,
          email: user.email,
          roles: cleanedRoles,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        session_id: req.sessionID,
        redirect: "/dashboard",
      });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/logout", (req, res) => {
  console.log("Successfully Logged Out");

  const sessionId = req.sessionID;

  if (!sessionId) {
    return res.status(400).json({ message: "No session found" });
  }

  // Destroy express-session session
  req.session.destroy(async (err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Failed to logout" });
    }

    try {
      // Clear session cookie
      res.clearCookie("connect.sid", {
        path: "/", // ensure it matches your cookie config
        httpOnly: true,
        sameSite: "strict", // or 'lax' if used in production
        secure: false, // true if using HTTPS in production
      });

      res.json({ message: "Logout successful" });
    } catch (dbErr) {
      console.error("DB Error during logout:", dbErr);
      res.status(500).json({ message: "Error deleting session from DB" });
    }
  });
});

app.post("/apply-as-mentor", async (req, res) => {
  const {
    affiliation,
    motivation,
    expertise,
    businessAreas,
    preferredTime,
    specificTime, // optional field for "Other"
    communicationMode
  } = req.body;

  const mentorID = req.session.user?.id;

  console.log("✅ [apply-as-mentor] Called with session.id:", mentorID);
  console.log("✅ [apply-as-mentor] Body payload:", {
    affiliation,
    motivation,
    expertise,
    businessAreas,
    preferredTime,
    specificTime,
    communicationMode
  });

  try {
    // ✅ Validate required fields
    if (
      !affiliation || !motivation || !expertise ||
      !Array.isArray(businessAreas) || businessAreas.length === 0 ||
      !Array.isArray(preferredTime) || preferredTime.length === 0 ||
      !Array.isArray(communicationMode) || communicationMode.length === 0
    ) {
      console.warn("⚠️ [apply-as-mentor] Missing required fields");
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // ✅ Fetch user info from users table
    console.log("🔍 [apply-as-mentor] Querying user info for user_id:", mentorID);
    const userQuery = `
      SELECT first_name, last_name, email, contactnum, password
      FROM users
      WHERE user_id = $1
    `;
    const userResult = await pgDatabase.query(userQuery, [mentorID]);

    console.log("✅ [apply-as-mentor] User query result:", userResult.rows);

    if (userResult.rows.length === 0) {
      console.error("❌ [apply-as-mentor] User not found in DB");
      return res.status(404).json({ message: "User not found." });
    }

    const {
      first_name: firstName,
      last_name: lastName,
      email,
      contactnum: contactno,
      password
    } = userResult.rows[0];

    console.log("✅ [apply-as-mentor] User details fetched:", {
      firstName,
      lastName,
      email,
      contactno
    });

    // ✅ Merge "Other" input into preferredTime array
    let updatedPreferredTime = preferredTime.filter(Boolean);
    if (updatedPreferredTime.includes("Other") && specificTime?.trim()) {
      updatedPreferredTime = updatedPreferredTime.filter(t => t !== "Other");
      updatedPreferredTime.push(`${specificTime.trim()}`);
      console.log("✅ [apply-as-mentor] specificTime merged into preferredTime:", updatedPreferredTime);
    } else {
      console.log("✅ [apply-as-mentor] preferredTime:", updatedPreferredTime);
    }

    // ✅ Insert mentor application
    console.log("📝 [apply-as-mentor] Inserting mentor application...");

    const insertQuery = `
      INSERT INTO mentor_form_application (
        first_name,
        last_name,
        email,
        password,
        affiliation,
        motivation,
        expertise,
        business_areas,
        preferred_time,
        communication_mode,
        status,
        contact_no
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Pending',$11)
      RETURNING *;
    `;

    const values = [
      firstName,
      lastName,
      email,
      password,
      affiliation,
      motivation,
      expertise,
      businessAreas,
      updatedPreferredTime,
      communicationMode,
      contactno
    ];

    console.log("✅ [apply-as-mentor] Insert values:", values);

    const result = await pgDatabase.query(insertQuery, values);
    console.log("✅ [apply-as-mentor] Insert result:", result.rows);

    const newApplication = result.rows[0];

    if (!newApplication) {
      console.error("❌ [apply-as-mentor] Insert returned no rows");
      return res.status(500).json({ message: "Failed to submit mentor application." });
    }

    console.log("✅ [apply-as-mentor] Mentor application inserted successfully!");

    res.status(201).json({
      message: "Mentor application submitted successfully.",
      application: newApplication,
    });

  } catch (err) {
    console.error("❌ [apply-as-mentor] Error during mentor application:", err);
    res.status(500).json({ message: "An error occurred during mentor application." });
  }
});

app.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    contactno,
    password,
    affiliation,
    motivation,
    // expertise,
    businessAreas,
    preferredTime,
    specificTime, // optional field for "Other"
    communicationMode
  } = req.body;

  try {
    // ✅ Validate required fields
    if (
      !firstName || !lastName || !email || !contactno || !password ||
      !affiliation || !motivation ||
      // !expertise ||
      !Array.isArray(businessAreas) || businessAreas.length === 0 ||
      !Array.isArray(preferredTime) || preferredTime.length === 0 ||
      !Array.isArray(communicationMode) || communicationMode.length === 0
    ) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // ✅ Merge "Other" input into preferredTime array
    let updatedPreferredTime = preferredTime.filter(Boolean); // Remove any undefined
    if (updatedPreferredTime.includes("Other") && specificTime?.trim()) {
      updatedPreferredTime = updatedPreferredTime.filter(t => t !== "Other");
      updatedPreferredTime.push(`${specificTime.trim()}`);
    }

    // ✅ Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert mentor application
    const insertQuery = `
      INSERT INTO mentor_form_application (
        first_name,
        last_name,
        email,
        password,
        affiliation,
        motivation,
        business_areas,
        preferred_time,
        communication_mode,
        status,
        contact_no
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Pending',$10)
      RETURNING *;
    `;

    const values = [
      firstName,
      lastName,
      email,
      hashedPassword,
      affiliation,
      motivation,
      businessAreas,
      updatedPreferredTime,
      communicationMode,
      contactno,
    ];

    const result = await pgDatabase.query(insertQuery, values);
    const newApplication = result.rows[0];

    if (!newApplication) {
      return res.status(500).json({ message: "Failed to submit mentor application." });
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"LSEED Center" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for your application to LSEED',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
          <p>Dear ${firstName},</p>

          <p>
            Thank you for applying to become a mentor at the <strong>LSEED Center</strong>. 
            We truly appreciate your willingness to share your expertise and support aspiring social entrepreneurs.
          </p>

          <p>
            We will review your application and you will be notified of its status via email. 
            Please make sure to check your email regularly for updates regarding your application.
          </p>

          <p>
            Additionally, please take note of the credentials you submitted in this application. 
            If you are accepted, you will use these details to log in to your mentor account on the platform.
          </p>

          <p>
            Warm regards,<br/>
            The LSEED Team
          </p>
        </div>
      `,
    });

    // LSEED-Director notification
    const lseedDirectors = await getLSEEDDirectors(); // change your function if needed

    if (lseedDirectors && lseedDirectors.length > 0) {
      const directorTitle = "New Mentor Application";
      const notificationDirectorMessage =
        `A new mentor has submitted an application. Review their details in the mentors page.`;

      for (const director of lseedDirectors) {
        const receiverId = director.user_id;

        await pgDatabase.query(
          `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
          VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/mentors');`,
          [receiverId, directorTitle, notificationDirectorMessage]
        );
      }
    }

    res.status(201).json({
      message: "Mentor application submitted successfully.",
      application: newApplication,
    });

  } catch (err) {
    console.error("Error during mentor signup:", err);
    res.status(500).json({ message: "An error occurred during mentor signup." });
  }
});

app.post("/notify-mentor-application-status", async (req, res) => {
  const { applicationId, status } = req.body;

  if (!applicationId || !status) {
    return res.status(400).json({ message: "applicationId and status are required." });
  }

  try {
    // 🔍 Get mentor application record
    const { rows } = await pgDatabase.query(
      `SELECT first_name, last_name, email FROM mentor_form_application WHERE id = $1`,
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Application not found." });
    }

    const { first_name, email } = rows[0];

    // ✉️ Set up email transport
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 📧 Compose Declined email only
    const subject = "Your LSEED Mentor Application Status";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
        <p style="margin: 0 0 16px;">Dear ${first_name},</p>

        <p style="margin: 0 0 16px;">
          Thank you for your interest in becoming a mentor at the <strong>LSEED Center</strong>.
        </p>

        <p style="margin: 0 0 16px;">
          After careful consideration, we regret to inform you that your application has not been approved at this time.
        </p>

        <p style="margin: 0;">
          We encourage you to stay connected and consider applying again in the future.
        </p>

        <p style="margin: 0;">
          Warm regards,<br/>
          The LSEED Team
        </p>
      </div>
    `;

    // ✉️ Send email
    await transporter.sendMail({
      from: `"LSEED Center" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`✅ Declined email sent to ${email}`);
    res.json({ message: "Decline notification email sent successfully." });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).json({ message: "Failed to send email notification." });
  }
});

app.post("/signup-lseed-role", async (req, res) => {
  const { firstName, lastName, email, contactno, password, token } = req.body;

  if (!firstName || !lastName || !email || !contactno || !password || !token) {
    return res.status(400).json({ message: "All fields and token are required." });
  }

  try {
    // 1️⃣ Validate the invite token and retrieve role
    const inviteResult = await pgDatabase.query(
      `SELECT * FROM coordinator_invites WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired invite token." });
    }

    const invitedRole = inviteResult.rows[0].role || 'LSEED-Coordinator';

    console.log(invitedRole);

    // 2️⃣ Check if email already exists
    const existingUser = await pgDatabase.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Insert user with correct role
    const userResult = await pgDatabase.query(
      `
      INSERT INTO users (first_name, last_name, email, password, contactnum, roles, isactive)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING user_id
      `,
      [firstName, lastName, email, hashedPassword, contactno, invitedRole]
    );

    const userId = userResult.rows[0].user_id;

    // Assign role in user_has_roles
    await pgDatabase.query(
      `INSERT INTO user_has_roles (user_id, role_name) VALUES ($1, $2)`,
      [userId, invitedRole]
    );

    // 5️⃣ Optionally: delete or mark invite as used
    await pgDatabase.query(
      `DELETE FROM coordinator_invites WHERE token = $1`,
      [token]
    );

    console.log(`✅ New ${invitedRole} registered: ${email}`);

    // 6️⃣ Welcome notification
    const notificationTitle = `Welcome to LSEED Insight!`;
    const notificationMessage = invitedRole === 'LSEED-Coordinator'
      ? "As a LSEED-Coordinator, you can manage mentors, oversee social enterprises, and facilitate impactful connections involved in your assigned program. We're excited to have you on board."
      : "As a LSEED-Director, you will oversee programs and manage platform-wide operations. Welcome to the LSEED platform!";

    const targetRoute = invitedRole === 'LSEED-Coordinator' ? '/dashboard/lseed' : '/dashboard/director';

    await pgDatabase.query(
      `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route)
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), $4);`,
      [userId, notificationTitle, notificationMessage, targetRoute]
    );

    // 7️⃣ Notify LSEED Directors if a Coordinator just signed up
    if (invitedRole === 'LSEED-Coordinator') {
      const lseedDirectors = await getLSEEDDirectors(); // Your function to fetch directors

      if (lseedDirectors?.length) {
        const coordinatorName = `${firstName} ${lastName}`;
        const directorTitle = "LSEED-Coordinator Sign Up Successful!";
        const directorMessage = `LSEED-Coordinator ${coordinatorName} has successfully signed up. You may now assign programs or monitor their activities via the Manage Programs page.`;

        for (const director of lseedDirectors) {
          await pgDatabase.query(
            `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
             VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/programs');`,
            [director.user_id, directorTitle, directorMessage]
          );
        }
      }
    }

    res.status(201).json({ message: `${invitedRole} account created successfully.` });

  } catch (err) {
    console.error("❌ Error in /signup-lseed-role:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

app.post("/accept-mentor-application", async (req, res) => {
  const { applicationId } = req.body;

  try {
    // Start a transaction for atomicity
    await pgDatabase.query('BEGIN');

    // 1. Get application
    const result = await pgDatabase.query(
      `SELECT * FROM mentor_form_application WHERE id = $1 FOR UPDATE`,
      [applicationId]
    );

    if (result.rowCount === 0) {
      await pgDatabase.query('ROLLBACK');
      return res.status(404).json({ message: "Application not found." });
    }

    const app = result.rows[0];

    // 2. Check if user email already exists
    const existingUserResult = await pgDatabase.query(
      `SELECT * FROM users WHERE email = $1`,
      [app.email]
    );

    if (existingUserResult.rowCount > 0) {
      const existingUser = existingUserResult.rows[0];

      // Check if they are an LSEED-Coordinator
      const rolesResult = await pgDatabase.query(
        `SELECT role_name FROM user_has_roles WHERE user_id = $1`,
        [existingUser.user_id]
      );

      const roles = rolesResult.rows.map(r => r.role_name);
      const isCoordinator = roles.includes('LSEED-Coordinator');

      if (!isCoordinator) {
        // ❌ User exists but is *not* a coordinator → reject
        await pgDatabase.query('ROLLBACK');
        return res.status(409).json({ message: "A user with this email already exists and is not a Coordinator." });
      }

      // ✅ User is Coordinator → add Mentor role
      await pgDatabase.query(
        `INSERT INTO user_has_roles (user_id, role_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [existingUser.user_id, 'Mentor']
      );

      // ✅ Insert into mentors table using existing user details + application areas
      await pgDatabase.query(
        `INSERT INTO mentors (
          mentor_id,
          mentor_firstname,
          mentor_lastname,
          email,
          contactnum,
          critical_areas,
          preferred_mentoring_time,
          accepted_application_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          existingUser.user_id,
          existingUser.first_name,
          existingUser.last_name,
          existingUser.email,
          existingUser.contactnum,
          app.business_areas,
          app.preferred_time,
          applicationId
        ]
      );

      // ✅ Update application status
      await pgDatabase.query(
        `UPDATE mentor_form_application SET status = 'Approved' WHERE id = $1`,
        [applicationId]
      );

      // Create Mentor Status Updated Notification
      const notificationTitle = "Mentor Access Granted";
      const notificationWelcomeMessage =
        "Your application to also serve as a mentor has been approved. You can now use your account to access mentor features, connect with social enterprises, and support them through mentorship. Visit your dashboard to get started.";

      await pgDatabase.query(
        `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route)
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/dashboard/mentor');`,
        [existingUser.user_id, notificationTitle, notificationWelcomeMessage]
      )

      await pgDatabase.query('COMMIT');

      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // ✉️ Send email
      await transporter.sendMail({
        from: `"LSEED Center" <${process.env.EMAIL_USER}>`,
        to: existingUser.email,
        subject: "Your LSEED Mentor Application Has Been Accepted",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
            <p style="margin: 0 0 16px;">Dear ${existingUser.first_name},</p>

            <p style="margin: 0 0 16px;">
              Your request to also serve as a mentor within the <strong>LSEED Center</strong> has been approved.
            </p>

            <p style="margin: 0 0 16px;">
              Your account has now been granted mentor access. You may continue using your existing login credentials to access mentor features.
              <a href="${process.env.WEBHOOK_BASE_URL}" style="color: #1E4D2B; text-decoration: underline;">Click here to Login</a>
            </p>

            <p style="margin: 0;">
              Warm regards,<br/>
              <strong>The LSEED Team</strong>
            </p>
          </div>
        `
      });

      return res.status(201).json({ message: "Mentor successfully added" });
    }

    // 3. User doesn't exist → normal path, create user account
    const userResult = await pgDatabase.query(
      `INSERT INTO users (first_name, last_name, email, password, contactnum, roles, isactive)
       VALUES ($1, $2, $3, $4, $5, 'Mentor', true)
       RETURNING user_id`,
      [app.first_name, app.last_name, app.email, app.password, app.contact_no]
    );

    const newUserId = userResult.rows[0].user_id;

    await pgDatabase.query(
      `INSERT INTO user_has_roles (user_id, role_name) VALUES ($1, $2)`,
      [newUserId, 'Mentor']
    );

    await pgDatabase.query(
      `INSERT INTO mentors (
        mentor_id,
        mentor_firstname,
        mentor_lastname,
        email,
        contactnum,
        critical_areas,
        preferred_mentoring_time,
        accepted_application_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        newUserId,
        app.first_name,
        app.last_name,
        app.email,
        app.contact_no,
        app.business_areas,
        app.preferred_time,
        applicationId
      ]
    );

    await pgDatabase.query(
      `UPDATE mentor_form_application SET status = 'Approved' WHERE id = $1`,
      [applicationId]
    );

    await pgDatabase.query('COMMIT');

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✉️ Send email
    await transporter.sendMail({
      from: `"LSEED Center" <${process.env.EMAIL_USER}>`,
      to: app.email,
      subject: "Your LSEED Mentor Application Has Been Accepted",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
          <p style="margin: 0 0 16px;">Dear ${app.first_name},</p>

          <p style="margin: 0 0 16px;">
            Congratulations! Your application to become a mentor at the <strong>LSEED Center</strong> has been accepted.
          </p>

          <p style="margin: 0 0 16px;">
            You may now log in using the credentials you submitted during signup.
            <br/>
            <a href="${process.env.WEBHOOK_BASE_URL}" style="color: #1E4D2B; text-decoration: underline;">Click here to Login</a>
          </p>

          <p style="margin: 0;">
            Warm regards,<br/>
            The LSEED Team
          </p>
        </div>
      `
    });

    // Create Notification
    // Create Welcome Message
    const notificationTitle = "Welcome to LSEED Insight";
    const notificationWelcomeMessage =
      "As a mentor at the LSEED Center, you can support social enterprises by sharing your expertise and guidance. We're excited to have you on board! Explore your dashboard to evaluate social enterprises, schedule mentoring sessions, and make an impact.";

    await pgDatabase.query(
      `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route)
      VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/dashboard/mentor');`,
      [newUserId, notificationTitle, notificationWelcomeMessage]
    )
    return res.status(201).json({ message: "Mentor successfully added" });
  } catch (err) {
    await pgDatabase.query('ROLLBACK');
    console.error("❌ Error processing mentor application:", err);
    res.status(500).json({ message: "Failed to create mentor account." });
  }
});

app.get("/api/mentors", async (req, res) => {
  try {
    const mentors = await getAllMentors();
    res.json(mentors);
  } catch (error) {
    console.error("❌ Error fetching mentors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentors-with-mentorships", async (req, res) => {
  try {
    const mentors = await getAllMentorsWithMentorships();
    res.json(mentors);
  } catch (error) {
    console.error("❌ Error fetching mentors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const program = req.query.program || null; // Optional program param

    const mentorshipCount = await getMentorCount();
    const mentorsWithMentorshipCount = await getMentorshipCount();
    const mentorsWithoutMentorshipCount = await getWithoutMentorshipCount();

    // ✅ Fetch the total number of social enterprises
    const totalSocialEnterprises = await getTotalSECount(program);

    // ✅ Fetch the number of programs
    const totalPrograms = await getProgramCount();

    res.json({
      mentorCountTotal: mentorshipCount,
      mentorWithMentorshipCount: mentorsWithMentorshipCount,
      mentorWithoutMentorshipCount: mentorsWithoutMentorshipCount,
      totalSocialEnterprises: parseInt(totalSocialEnterprises[0].count), // ✅ Fix here
      totalPrograms: parseInt(totalPrograms[0].count), // ✅ Fix here
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Toggle mentor availability
app.post("/toggle-mentor-availability", async (req, res) => {
  const { isAvailable } = req.body;
  const mentorID = req.session.user?.id;

  if (!mentorID) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await pgDatabase.query(
      `UPDATE mentors SET is_available_for_assignment = $1 WHERE mentor_id = $2`,
      [isAvailable, mentorID]
    );

    res.status(200).json({ message: `Availability updated to ${isAvailable}.` });
  } catch (err) {
    console.error("❌ Error toggling availability:", err);
    res.status(500).json({ message: "Error updating availability." });
  }
});

app.get("/getAuditLogs", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const auditLogs = await getAuditLogs({ page, limit });

    res.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/invite-lseed-user", async (req, res) => {
  const { email } = req.body;
  const ipAddress = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
  const userId = req.session.user?.id;
  const activeRole = req.session.user?.activeRole;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // 1. Check if the email already belongs to an existing user
    const existingUser = await pgDatabase.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // 2. Generate invite token
    const inviteToken = crypto.randomUUID();

    // 3. Determine role to be assigned on signup
    const inviteeRole = activeRole === "Administrator" ? "LSEED-Director" : "LSEED-Coordinator";

    // 4. Store in DB
    await pgDatabase.query(
      'INSERT INTO coordinator_invites (email, token, role) VALUES ($1, $2, $3)',
      [email, inviteToken, inviteeRole]
    );

    // 5. Prepare sign-up page link
    const signUpLink = `${process.env.WEBHOOK_BASE_URL}/lseed-signup?token=${inviteToken}`;
    console.log('✅ Sign-up link:', signUpLink);

    // 6. Determine who the invite is "from"
    const invitedBy = activeRole === "Administrator" ? "LSEED Admin Team" : "LSEED Director";

    // 7. Compose email
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
        <p style="margin: 0 0 16px;">Dear ${inviteeRole},</p>

        <p style="margin: 0 0 16px;">
          The <strong>${invitedBy}</strong> has invited you to join as a <strong>${inviteeRole}</strong> on the <strong>LSEED platform</strong>.
        </p>

        <p style="margin: 0 0 16px;">
          Please click the link below to set up your account:
        </p>

        <p style="margin: 0 0 16px;">
          <a href="${signUpLink}" style="color: #1a73e8;">${signUpLink}</a>
        </p>

        <p style="margin: 0;">
          <em>This link will expire in 24 hours.</em>
        </p>
      </div>
    `;

    // 8. Send email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"LSEED Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `You're invited to join LSEED as a ${inviteeRole}`,
      html: emailHTML,
    });

    // 9. Audit log
    await pgDatabase.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [userId, `Invited ${inviteeRole} to create account`, JSON.stringify({ invited_email: email }), ipAddress]
    );

    res.status(201).json({ message: 'Invitation email sent successfully.' });

  } catch (err) {
    console.error('❌ Error inviting user:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

app.get('/validate-invite-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }

  const result = await pgDatabase.query(
    'SELECT * FROM coordinator_invites WHERE token = $1 AND expires_at > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  res.json({ valid: true });
});

// Returns mentor availability for mentorship
app.get("/get-mentor-availability", async (req, res) => {
  const mentorId = req.session.user?.id;

  try {
    const result = await pgDatabase.query(
      `SELECT is_available_for_assignment FROM mentors WHERE mentor_id = $1`,
      [mentorId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const isAvailable = result.rows[0].is_available_for_assignment;
    res.json({ isAvailable });
  } catch (err) {
    console.error("Error fetching mentor availability:", err);
    res.status(500).json({ message: "Server error" });
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
    const program = req.query.program || null; // Optional program param
    const mentorID = req.session.user?.id;

    const result = await getPendingSchedules(program, mentorID);

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/flagged-ses", async (req, res) => {
  try {
    const program = req.query.program || null; // Optional program param

    const result = await getFlaggedSEs(program);

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/ack-data", async (req, res) => {
  try {
    const program = req.query.program || null; // Optional program param

    const result = await getAcknowledgementData(program);

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/evaluation-stats", async (req, res) => {
  try {
    const program = req.query.program || null; // Optional program param

    const result = await getAllEvaluationStats(program);

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching pending schedules:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/analytics-stats", async (req, res) => {
  try {
    const program = req.query.program || null; // Optional program param

    // ✅ Fetch data
    const totalSocialEnterprises = await getTotalSECount(program);
    const withMentorship = await getSEWithMentors(program);
    const withoutMentorship = await getSEWithOutMentors(program);
    const growthScore = await getGrowthScoreOverallAnually(program);
    const previousTotalSocialEnterprises = await getPreviousTotalSECount(program);

    const currentWithMentorshipCount = parseInt(withMentorship[0]?.total_se_with_mentors || 0);
    const currentWithoutMentorshipCount = parseInt(withoutMentorship[0]?.total_se_without_mentors || 0);

    // ✅ Total Growth (sum of `growth`)
    const currentGrowthScoreValue = growthScore.reduce((sum, entry) => sum + parseFloat(entry.growth || 0), 0);

    // ✅ Get the latest cumulative growth value
    const cumulativeGrowthValue = growthScore.length > 0 ? parseFloat(growthScore[growthScore.length - 1].cumulative_growth || 0) : 0;

    const categoricalScoreForAllSE = await getAverageScoreForAllSEPerCategory(program);
    const improvementScore = await getImprovementScorePerMonthAnnually(program);
    const leaderboardData = await getSELeaderboards(program);

    // ✅ Return Response
    res.json({
      totalSocialEnterprises: parseInt(totalSocialEnterprises[0].count),
      previousMonthSECount: parseInt(previousTotalSocialEnterprises[0].count),
      withMentorship: currentWithMentorshipCount,
      withoutMentorship: currentWithoutMentorshipCount,
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

app.get("/fetch-mentor-dashboard-stats", async (req, res) => {
  try {
    const mentorID = req.session.user?.id;

    // ✅ Fetch data
    const totalEvalMade = await getEvaluationSubmittedCount(mentorID);
    const avgRatingGiven = await getAvgRatingGivenByMentor(mentorID);
    const mostCommonRating = await getCommonRatingGiven(mentorID);
    const mentorshipsCount = await getMentorshipCountByMentorID(mentorID);

    // ✅ Return Response
    res.json({
      totalEvalMade,
      avgRatingGiven,
      mostCommonRating,
      mentorshipsCount,
    });

  } catch (error) {
    console.error("❌ Error fetching mentor dashboard stats:", error);
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

    let { mentorId, se_id, evaluations, mentoring_session_id } = req.body;
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
        SELECT chatid FROM telegrambot WHERE mentor_id = $1 AND se_id = $2;
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

    // Update status of mentoring session
    await pgDatabase.query(
      `UPDATE mentoring_session SET status = 'Evaluated' WHERE mentoring_session_id = $1`,
      [mentoring_session_id]
    );

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
    const program = req.query.program || null; // Optional program param

    const schedules = await getSchedulingHistory(program);
    res.json(schedules);
  } catch (error) {
    console.error("❌ Error fetching mentor schedules:", error);
    res.status(500).json({ error: "Failed to fetch mentor schedules" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await getUsers(); // Fetch users from DB
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get('/check-mentor-application-status', async (req, res) => {
  try {
    // Get user email from your session
    const userEmail = req.session.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Query
    const query = 'SELECT status FROM mentor_form_application WHERE email = $1';
    const { rows } = await pgDatabase.query(query, [userEmail]);

    let allowed;
    if (rows.length === 0) {
      // No application yet: allow to apply
      allowed = true;
    } else {
      const status = rows[0].status;
      // Block if Pending or Approved
      allowed = !(status === 'Pending' || status === 'Approved');
    }

    return res.json({ allowed });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/get-programs", async (req, res) => {
  try {
    const programCoordinators = await getProgramCoordinators(); // Fetch users from DB
    if (!programCoordinators || programCoordinators.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.json(programCoordinators);
  } catch (error) {
    console.error("Error fetching program coordinators:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/get-lseed-coordinators", async (req, res) => {
  try {
    const lseedCoordinators = await getLSEEDCoordinators();
    if (!lseedCoordinators || lseedCoordinators.length === 0) {
      return res.json([]); // Return an empty array if no LSEED coordinators are found
    }
    res.json(lseedCoordinators);
  } catch (error) {
    console.error("Error fetching LSEED coordinators:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/assign-program-coordinator", async (req, res) => {
  const { program_id, user_id } = req.body; // Expect program_id and user_id (can be null)

  // Basic validation
  if (!program_id) {
    return res.status(400).json({ message: "Program ID is required." });
  }

  try {
    // Call the function from your controller to handle the database logic
    const result = await assignProgramCoordinator(program_id, user_id);

    // Send a success response
    res.json({ message: "Program assignment updated successfully", assignment: result });
  } catch (error) {
    // Log the error and send an appropriate error response
    console.error("API Error assigning program coordinator:", error);
    res.status(500).json({ message: "Failed to update program assignment.", error: error.message });
  }
});

app.post("/api/mentorship/insert-collaboration", async (req, res) => {
  try {
    const { collaboration_request_details } = req.body;

    // Extract SE IDs from collaboration_card_id
    const cardId = collaboration_request_details.collaboration_card_id;

    const match = cardId.match(
      /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})_([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/
    );

    const seeking_collaboration_se_id = match[1];
    const suggested_collaboration_se_id = match[2];

    // Insert the collaboration request
    const mentorDetails = await getMentorBySEID(seeking_collaboration_se_id);

    const suggested_mentorship = await getMentorBySEID(suggested_collaboration_se_id)

    // Insert the collaboration request
    await insertCollaboration(collaboration_request_details, mentorDetails.mentorship_id, suggested_mentorship.mentorship_id);

    // 🔔 Send notification to the suggested mentor
    const seekingMentorName = collaboration_request_details.seeking_collaboration_mentor_name;
    const suggestedMentorName = collaboration_request_details.suggested_collaboration_mentor_name;
    const seName = collaboration_request_details.seeking_collaboration_se_name;

    const notificationTitle = `Collaboration Accepted for ${seName}`;
    const notificationMessage = `${suggestedMentorName} has accepted collaborating with your mentorship SE, ${seekingMentorName}.`;

    await pgDatabase.query(
      `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route)
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/collaboration-dashboard');`,
      [mentorDetails.mentor_id, notificationTitle, notificationMessage]
    );

    res.status(200).json({ message: "Collaboration request submitted and notification sent." });
  } catch (error) {
    console.error("Error inserting collaboration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/mentorship/request-collaboration", async (req, res) => {
  try {
    const { collaboration_request_details } = req.body;

    // Insert the collaboration request
    await requestCollaborationInsert(collaboration_request_details);

    // 🔔 Send notification to the suggested mentor
    const suggestedMentorId = collaboration_request_details.suggested_collaboration_mentor_id;
    const seekingMentorName = collaboration_request_details.seeking_collaboration_mentor_name;
    const seName = collaboration_request_details.seeking_collaboration_se_name;

    const notificationTitle = "New Collaboration Request Received";
    const notificationMessage = `${seekingMentorName} has requested a collaboration, under their mentorship with ${seName}.`;

    await pgDatabase.query(
      `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route)
       VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/collaboration-dashboard');`,
      [suggestedMentorId, notificationTitle, notificationMessage]
    );

    res.status(201).json({ message: "Collaboration request submitted and notification sent." });
  } catch (error) {
    console.error("Error requesting collaboration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentorship/suggested-collaborations/:mentorship_id", async (req, res) => {
  try {
    const userId = req.session.user?.id; // Safely extract from session
    const mentorship_id = req.params.mentorship_id

    const collaborationStats = await getSuggestedCollaborations(userId, mentorship_id);

    res.json(collaborationStats);
  } catch (error) {
    console.error("Error fetching collaboration stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentorship/get-collaborations", async (req, res) => {
  try {
    const userId = req.session.user?.id; // Safely extract from session

    const collaborations = await getExistingCollaborations(userId);

    res.json(collaborations);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentorship/get-collaboration-requests", async (req, res) => {
  try {
    const userId = req.session.user?.id; // Safely extract from session

    const collaborationRequests = await getCollaborationRequests(userId);

    res.json(collaborationRequests);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentorship/view-collaboration-request/:mentorship_collaboration_request_id", async (req, res) => {
  try {
    const mentorship_collaboration_request_id = req.params.mentorship_collaboration_request_id

    const viewCollabDetails = await getCollaborationRequestDetails(mentorship_collaboration_request_id);

    res.json(viewCollabDetails);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentorship/get-collaborators", async (req, res) => {
  try {
    const userId = req.session.user?.id; // Safely extract from session

    const collaborators = await getCollaborators(userId);

    res.json(collaborators);
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/get-program-coordinator", async (req, res) => {
  try {
    const userId = req.session.user?.id; // Safely extract from session

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. No user session." });
    }

    const programCoordinators = await getProgramAssignment(userId);

    if (!programCoordinators || programCoordinators.length === 0) {
      return res.status(404).json({ message: "No programs found for this user" });
    }

    res.json(programCoordinators);
  } catch (error) {
    console.error("Error fetching program coordinator:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/userDetails", (req, res) => {
  // Check if the session is authenticated
  if (req.session && req.session.isAuth && req.session.user) {
    // Return only what's necessary
    return res.json({
      id: req.session.user.id,
      email: req.session.user.email,
      role: req.session.user.role,
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
    });
  } else {
    return res.status(401).json({ message: "Unauthorized" });
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
    const program = req.query.program || null; // Optional program param

    const result = await getAllSocialEnterprisesWithMentorship(program); // Fetch SEs from DB
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

app.get("/get-accepted-application/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const application = await getAcceptedApplications(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json(application);
  } catch (error) {
    console.error("Error fetching application by ID:", error);
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
    const program = req.query.program || null; // Optional program param

    const result = await getAllSocialEnterprisesForComparison(program); // Fetch SEs from DB
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
    const mentor_id = req.session.user?.id;

    if (!mentor_id) {
      return res.status(400).json({ message: "mentor_id is required" });
    }

    const result = await getEvaluationsMadeByMentor(mentor_id); // Fetch SEs from DB
    if (!result || result.length === 0) {
      return res.json([]);
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/mentorSchedulesByID", async (req, res) => {
  try {
    const mentor_id = req.session.user?.id; // Safely extract from session

    if (!mentor_id) {
      return res.status(400).json({ message: "mentor_id is required" });
    }

    const result = await getSchedulingHistoryByMentorID(mentor_id); // Fetch SEs from DB
    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/get-mentor-pending-sessions", async (req, res) => {
  try {
    const mentor_id = req.session.user?.id; // Safely extract from session

    if (!mentor_id) {
      return res.status(400).json({ message: "mentor_id is required" });
    }

    const result = await getPendingSchedulesForMentor(mentor_id); // Fetch SEs from DB
    res.json(result);
  } catch (error) {
    console.error("Error fetching pending mentor schedules:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/show-signup-password", async (req, res) => {
  try {
    const otp = await getSignUpPassword();

    res.json({ otp });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ message: "Error generating OTP" });
  }
});

app.get("/getRecentMentorEvaluations", async (req, res) => {
  try {
    const mentor_id = req.session.user?.id; // Safely extract from session

    if (!mentor_id) {
      return res.status(400).json({ message: "mentor_id is required" });
    }

    const result = await getRecentEvaluationsMadeByMentor(mentor_id); // Fetch SEs from DB
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No evaluations found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getUpcomingSchedulesForMentor", async (req, res) => {
  try {
    // DOUBLE CHECK
    const mentor_id = req.session.user?.id; // Safely extract from session

    if (!mentor_id) {
      return res.status(400).json({ message: "mentor_id is required" });
    }

    const result = await getUpcomingSchedulesForMentor(mentor_id); // Fetch SEs from DB
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No evaluations found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching social enterprises:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getMentorEvaluationsBySEID/:se_id", async (req, res) => {
  try {
    const { se_id } = req.params; // Extract se_id from route parameters

    if (!se_id) {
      return res.status(400).json({ message: "se_id is required" });
    }

    const result = await getEvaluationsBySEID(se_id); // Fetch from DB
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

app.get("/getAllMentorEvaluationType", async (req, res) => {
  try {
    const result = await getAllMentorTypeEvaluations() // Fetch SEs from DB
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

app.get("/checkTelegramRegistration", async (req, res) => {
  const { mentor_id, se_id } = req.query;

  if (!mentor_id || !se_id) {
    return res.status(400).json({ message: "mentor_id and se_id are required" });
  }

  try {
    const exists = await checkTelegramBotTable(mentor_id, se_id); // Your DB query
    return res.json({ exists });
  } catch (err) {
    console.error("❌ Error checking telegram registration:", err);
    return res.status(500).json({ message: "Internal Server Error" });
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

app.post("/api/session/role", (req, res) => {
  const { activeRole } = req.body;

  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  // Optionally validate role
  const allowedRoles = req.session.user.roles || [];
  if (!allowedRoles.includes(activeRole)) {
    return res.status(400).json({ error: "Role not assigned to user" });
  }

  req.session.user.activeRole = activeRole;

  console.log("✅ Active role set in session:", req.session.user);

  res.json({ success: true });
});

app.get("/api/top-se-performance", async (req, res) => {
  try {
    const period = req.query.period;
    const program = req.query.program || null;
    const se_id = req.query.se_id || null;

    const user_id = req.session.user?.id;
    let mentor_id = null;

    // Check if the user is acting as a mentor
    if (
      req.session.user?.activeRole === "Mentor" ||
      (req.session.user?.roles?.includes("Mentor") && !req.session.user?.activeRole)
    ) {
      mentor_id = user_id;
    }

    if (se_id && mentor_id) {
      // Step 1: Check if user is the direct mentor
      const seMentorCheckQuery = `
        SELECT mentor_id FROM mentorships
        WHERE se_id = $1
        LIMIT 1;
      `;
      const mentorResult = await pgDatabase.query(seMentorCheckQuery, [se_id]);

      const actualMentorId = mentorResult.rows[0]?.mentor_id;

      if (!actualMentorId) {
        return res.status(404).json({ message: "SE not found or not part of any mentorship." });
      }

      // Step 2: If user is the mentor, proceed
      if (actualMentorId === user_id) {
        mentor_id = user_id; // Confirm assignment for clarity
      } else {
        // Step 3: Check if user is a collaborator on a mentorship tied to this SE
        const collabCheckQuery = `
          SELECT 1
          FROM mentorship_collaborations mc
          JOIN mentorships ms_suggested ON mc.suggested_collaborator_mentorship_id = ms_suggested.mentorship_id
          JOIN mentorships ms_seeking ON mc.seeking_collaboration_mentorship_id = ms_seeking.mentorship_id
          WHERE mc.status = true
            AND $1 = ANY (ARRAY[ms_suggested.mentor_id, ms_seeking.mentor_id])
            AND $2 = ANY (ARRAY[ms_suggested.se_id, ms_seeking.se_id])
          LIMIT 1;
        `;
        const collabCheck = await pgDatabase.query(collabCheckQuery, [user_id, se_id]);

        if (collabCheck.rows.length === 0) {
          return res.status(403).json({ message: "Access denied: You are not authorized to view this SE." });
        }

        // ✅ User is a collaborator, use the SE's assigned mentor_id
        mentor_id = actualMentorId;
      }
    }
    // Proceed to fetch SE performance
    const result = await getTopSEPerformance(period, program, mentor_id, se_id);

    if (result.length === 0) {
      return res.status(404).json({ message: "No performance data available" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching top SE performance:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



app.get("/api/overall-radar-data", async (req, res) => {
  const client = await pgDatabase.connect();
  try {
    const query = `
      SELECT 
        category_name as category,
        AVG(CAST(rating as DECIMAL)) as score
      FROM evaluations e
      JOIN evaluation_categories ect ON e.evaluation_id = ect.evaluation_id
      GROUP BY category_name
      ORDER BY category_name
    `;
    
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching overall radar data:", error);
    res.status(500).json({ message: "Failed to fetch overall radar data" });
  } finally {
    client.release();
  }
});

app.get("/api/overall-category-stats", async (req, res) => {
  const client = await pgDatabase.connect();
  try {
    const query = `
      SELECT 
        ect.category_name,
        ect.rating,
        COUNT(*) as rating_count,
        AVG(CAST(ect.rating as DECIMAL)) as avg_rating
      FROM evaluations e
      JOIN evaluation_categories ect ON e.evaluation_id = ect.evaluation_id
      GROUP BY ect.category_name, ect.rating
      ORDER BY ect.category_name, ect.rating
    `;
    
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching overall category stats:", error);
    res.status(500).json({ message: "Failed to fetch overall category stats" });
  } finally {
    client.release();
  }
});

// Main endpoint for generating overall evaluation report
app.post("/api/overall-evaluation-report", async (req, res) => {
  try {
    const { chartImageRadar, overallCategoryStats, overallRadarData } = req.body;
    
    if (!chartImageRadar) {
      return res.status(400).json({ message: "Missing radar chart image" });
    }

    const imageBuffer = Buffer.from(chartImageRadar.split(",")[1], "base64");

    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=overall_evaluation_report.pdf`,
      });
      res.send(pdfBuffer);
    });

    // FIXED: Declare variables only once at the top
    let estimatedTotalPages = 4; // Most reports will have 2-3 pages
    let currentPageNumber = 1;   // Track current page number

    // Helper function to add page number to current page
  const addPageNumber = (pageNum, totalPages) => {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.top;
  
  // Save current settings
  const currentFontSize = doc._fontSize;
  
  doc.fontSize(10)
     .fillColor('gray')
     .text(`Page ${pageNum} of ${totalPages}`, 
           pageWidth - 120, // From right edge
           margin - 20,     // Above content area
           { align: 'right', width: 100 });
  
  // Restore settings
  doc.fontSize(currentFontSize);
  // No font restoration needed since we didn't change it
};

    // ─── PAGE 1: TITLE AND OVERVIEW ───
    
    // ─── Title Section ───
    doc.fontSize(20).text("Overall Social Enterprise Evaluation Report", { align: "center" });
    doc.fontSize(12);

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Generated as of ${formattedDate}`, { align: "left" });

    // Column positions
    const leftColX = 40;
    const rightColX = 350;
    const sectionTopY = 80;
    let leftY = sectionTopY;
    let rightY = sectionTopY;

    // Left Column - Summary Stats
    // FIXED: Calculate total evaluations correctly
    // Group by category first, then sum ratings within each category to get evaluations per category
    const categoryGroups = {};
    overallCategoryStats.forEach(stat => {
      if (!categoryGroups[stat.category_name]) {
        categoryGroups[stat.category_name] = 0;
      }
      categoryGroups[stat.category_name] += parseInt(stat.rating_count);
    });
    
    // Total evaluations should be the count from any one category (they should all be the same)
    // Or if you want to be extra safe, take the average or first category
    const totalEvaluations = Object.values(categoryGroups)[0] || 0;
    
    // Alternative approach if categories might have different counts:
    // const totalEvaluations = Math.max(...Object.values(categoryGroups));
    
    // Ensure scores are numbers before calculating average
    const validScores = overallRadarData.filter(cat => cat.score !== undefined && cat.score !== null);
    const overallAverage = validScores.length > 0 ? 
      validScores.reduce((sum, cat) => sum + (typeof cat.score === 'number' ? cat.score : parseFloat(cat.score) || 0), 0) / validScores.length : 0;
    
    doc.text(`Overall Average Score: ${overallAverage.toFixed(2)}`, leftColX, leftY);
    leftY += 16;
    doc.text(`Total Evaluations: ${totalEvaluations}`, leftColX, leftY);

    // Move below taller column
    doc.y = Math.max(leftY, rightY) + 20;

    // ─── Analytics Section ───
    doc.fontSize(16).text("Analytics Summary", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(14).text("Performance Overview Across All Social Enterprises");
    doc.moveDown(0.5);
    doc.image(imageBuffer, { fit: [700, 180], align: "center" });
    doc.moveDown(1);

    // ─── Bottom Section: 2-Column Layout (similar to ad-hoc report) ───
    const startY = doc.y;
    const boxWidth = 250;
    const boxHeight = 45;
    const boxSpacingY = 10;
    const col1X = 40;
    const col2X = col1X + boxWidth + 20;
    const boxesPerColumn = 3;

    overallRadarData.slice(0, 6).forEach((item, index) => {
      const col = Math.floor(index / boxesPerColumn);
      const row = index % boxesPerColumn;
      const x = col === 0 ? col1X : col2X;
      const y = startY + row * (boxHeight + boxSpacingY);

      // Ensure score is a number and handle potential undefined/null values
      const score = typeof item.score === 'number' ? item.score : parseFloat(item.score) || 0;

      doc.rect(x, y, boxWidth, boxHeight).stroke();
      doc.fontSize(9)
        .text(`Category: ${item.category}`, x + 10, y + 10)
        .text(`Score: ${score.toFixed(2)}`, x + 10, y + 25);
    });

    // Insights Section (similar to ad-hoc report)
    const strengths = overallRadarData.filter(r => {
      const score = typeof r.score === 'number' ? r.score : parseFloat(r.score) || 0;
      return score > 3;
    }).map(r => r.category);
    
    const weaknesses = overallRadarData.filter(r => {
      const score = typeof r.score === 'number' ? r.score : parseFloat(r.score) || 0;
      return score <= 3;
    }).map(r => r.category);
    const insightX = col2X + boxWidth + 40;
    let insightY = startY;

    doc.fontSize(12).text("Overall Insights", insightX, insightY);
    insightY += 20;

    doc.fontSize(10).text("Program Strengths:", insightX, insightY);
    insightY += 15;
    if (strengths.length > 0) {
      strengths.forEach((s) => {
        doc.text(`• ${s}`, insightX + 10, insightY);
        insightY += 14;
      });
    } else {
      doc.text("• All areas need improvement", insightX + 10, insightY);
      insightY += 14;
    }

    insightY += 10;
    doc.text("Areas for Improvement:", insightX, insightY);
    insightY += 15;
    if (weaknesses.length > 0) {
      weaknesses.forEach((w) => {
        doc.text(`• ${w}`, insightX + 10, insightY);
        insightY += 14;
      });
    } else {
      doc.text("• All areas performing well", insightX + 10, insightY);
    }

    // Add page number to first page
    addPageNumber(currentPageNumber, estimatedTotalPages);

    // ─── PAGE 2: DETAILED INSIGHTS (Enhanced version) ───
    doc.addPage();
    currentPageNumber++; // FIXED: Increment instead of setting to 2
    
    const page2AxisX = 40;
    const page2AxisY = doc.y;
    const page2MaxWidth = 520;
    const page2GapY = 15;

    doc.fontSize(16).text("Detailed Category Analysis & Recommendations", page2AxisX, page2AxisY, { underline: true });
    doc.moveDown(1);
    doc.fontSize(10);
    let currentPage2Y = doc.y + 10;

    // REMOVED: Duplicate variable declarations that were causing errors

    // Category advice map (enhanced)
    const categoryAdviceMap = {
      "Marketing Plan/Execution": {
        belowTwo: "Immediate action required: Organize intensive marketing workshops covering digital marketing, branding basics, and customer acquisition strategies. Consider pairing SEs with marketing mentors.",
        twoToThree: "Schedule regular marketing mentoring sessions focusing on campaign planning, social media strategy, and market research techniques.",
        aboveThree: "Maintain momentum with advanced marketing workshops on analytics, conversion optimization, and scaling strategies."
      },
      "Teamwork": {
        belowTwo: "Critical intervention needed: Conduct team-building workshops, establish communication protocols, and implement peer accountability systems. Consider leadership training for SE founders.",
        twoToThree: "Organize collaborative activities and communication skills training. Introduce project management tools to improve coordination.",
        aboveThree: "Continue fostering collaboration through peer mentoring programs and cross-SE knowledge sharing sessions."
      },
      "Logistics": {
        belowTwo: "Urgent logistics training required: Cover supply chain basics, inventory management, and operational workflow design. Provide templates for logistics planning.",
        twoToThree: "Offer intermediate logistics mentoring focusing on process optimization and efficiency improvements.",
        aboveThree: "Focus on advanced logistics strategies including scaling operations and technology integration."
      },
      "Financial Planning/Management": {
        belowTwo: "Immediate financial literacy intervention: Provide basic accounting training, budgeting workshops, and financial reporting templates. Assign financial mentors to struggling SEs.",
        twoToThree: "Continue financial mentoring with focus on cash flow management, financial forecasting, and investment planning.",
        aboveThree: "Advance to sophisticated financial strategies including funding acquisition and financial risk management."
      },
      "Product/Service Design/Planning": {
        belowTwo: "Product development bootcamp needed: Cover user research, design thinking, and MVP development. Provide product planning frameworks and templates.",
        twoToThree: "Regular product mentoring sessions focusing on iterative design, user feedback integration, and market validation.",
        aboveThree: "Advanced product strategy workshops covering innovation, competitive analysis, and product scaling."
      },
      "Human Resource Management": {
        belowTwo: "HR fundamentals training required: Cover recruitment basics, team structure planning, and basic HR policies. Provide HR documentation templates.",
        twoToThree: "Intermediate HR mentoring focusing on team development, performance management, and organizational culture.",
        aboveThree: "Advanced HR strategy sessions covering talent retention, leadership development, and scaling HR practices."
      }
    };

    // Process category statistics - REUSING the categoryGroups we already calculated
    // Generate insights for each category (similar to ad-hoc report style)
    for (const [category, totalCount] of Object.entries(categoryGroups)) {
      // Get ratings breakdown for this category
      const categoryStats = overallCategoryStats.filter(stat => stat.category_name === category);
      const ratings = {};
      categoryStats.forEach(stat => {
        ratings[stat.rating] = parseInt(stat.rating_count);
      });

      const total = totalCount;
      const weighted = Object.entries(ratings).reduce(
        (acc, [r, c]) => acc + parseInt(r) * c,
        0
      );
      const average = total > 0 ? (weighted / total).toFixed(2) : "0.00";

      const score1 = ratings[1] || 0;
      const score2 = ratings[2] || 0;
      const score3 = ratings[3] || 0;
      const score4 = ratings[4] || 0;
      const score5 = ratings[5] || 0;

      // Determine key remark (similar to ad-hoc report logic)
      let remark = "";
      if (average >= 4 && score4 + score5 >= total * 0.7) {
        remark = "Strong performance across all SEs with most evaluators awarding high marks. The program demonstrates confidence and consistency in this area.";
      } else if (average >= 4) {
        remark = "Generally strong area across SEs, though some ratings suggest opportunities to reach excellence with more consistency.";
      } else if (average >= 3) {
        if (score1 + score2 >= total * 0.3) {
          remark = "Mixed performance across SEs. While some scores are favorable, a notable proportion of low ratings suggests deeper inconsistencies in the program.";
        } else {
          remark = "Moderate strength across SEs. There is foundational capability here, but enhancements could help reach best-in-class execution.";
        }
      } else if (average <= 2) {
        remark = "This category is underperforming across all SEs. A high concentration of low scores indicates a need for structured program-wide support and attention.";
      } else {
        remark = "Inconsistent performance across SEs. Low and mid-tier ratings dominate—suggests unclear processes or insufficient capability development.";
      }

      // Get appropriate advice
      let advice = "";
      if (average < 2) {
        advice = categoryAdviceMap[category]?.belowTwo || "Urgent program-wide intervention needed.";
      } else if (average < 3) {
        advice = categoryAdviceMap[category]?.twoToThree || "Regular mentoring sessions recommended.";
      } else {
        advice = categoryAdviceMap[category]?.aboveThree || "Maintain current strategies and consider advanced training.";
      }

      // Combine and format the insight block (similar to ad-hoc report)
      const title = `${category}`;
      const avgLine = `Program Average Score: ${average} / 5`;
      const distributionLine = `Distribution: 1(${score1}) 2(${score2}) 3(${score3}) 4(${score4}) 5(${score5})`;
      const fullInsight = `${remark} ${advice}`;

      const titleHeight = doc.heightOfString(title, { width: page2MaxWidth });
      const avgLineHeight = doc.heightOfString(avgLine, { width: page2MaxWidth });
      const distributionHeight = doc.heightOfString(distributionLine, { width: page2MaxWidth });
      const fullInsightHeight = doc.heightOfString(fullInsight, { width: page2MaxWidth });

      const totalHeight = titleHeight + avgLineHeight + distributionHeight + fullInsightHeight + page2GapY * 2;

      // Add new page if needed
      const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
      if (currentPage2Y + totalHeight > pageHeight) {
        // Add page number to current page before creating new page
        addPageNumber(currentPageNumber, estimatedTotalPages);
        
        doc.addPage();
        currentPageNumber++;
        currentPage2Y = doc.y;
      }

      // Render (similar to ad-hoc report formatting)
      doc.font("Helvetica-Bold").text(title, page2AxisX, currentPage2Y, { width: page2MaxWidth });
      currentPage2Y += titleHeight;

      doc.font("Helvetica-Bold").text(avgLine, page2AxisX, currentPage2Y, { width: page2MaxWidth });
      currentPage2Y += avgLineHeight;

      doc.font("Helvetica").text(distributionLine, page2AxisX, currentPage2Y, { width: page2MaxWidth });
      currentPage2Y += distributionHeight + 5;

      doc.font("Helvetica").text(fullInsight, page2AxisX, currentPage2Y, {
        width: page2MaxWidth,
        lineGap: 2,
      });
      currentPage2Y += fullInsightHeight + page2GapY;
    }

    // Add overall program recommendations
   

    doc.fontSize(14).font("Helvetica-Bold").text("Overall Program Recommendations", page2AxisX, currentPage2Y, { underline: true });
    currentPage2Y += 25;
    doc.fontSize(10).font("Helvetica");

    if (overallAverage < 2.5) {
      doc.text("• Implement comprehensive mentoring program across all categories", page2AxisX, currentPage2Y);
      currentPage2Y += 14;
      doc.text("• Increase frequency of training workshops and support sessions", page2AxisX, currentPage2Y);
      currentPage2Y += 14;
      doc.text("• Consider additional resources and dedicated support staff", page2AxisX, currentPage2Y);
    } else if (overallAverage < 3.5) {
      doc.text("• Continue current mentoring efforts with targeted improvements", page2AxisX, currentPage2Y);
      currentPage2Y += 14;
      doc.text("• Focus resources on weakest performing categories", page2AxisX, currentPage2Y);
      currentPage2Y += 14;
      doc.text("• Implement peer learning initiatives between high and low performers", page2AxisX, currentPage2Y);
    } else {
      doc.text("• Program is performing well overall - maintain current quality", page2AxisX, currentPage2Y);
      currentPage2Y += 14;
      doc.text("• Focus on scaling successful practices to all participating SEs", page2AxisX, currentPage2Y);
      currentPage2Y += 14;
      doc.text("• Consider advanced training modules for high-performing SEs", page2AxisX, currentPage2Y);
    }

    // FIXED: Add page number to final page with proper total count
    // Update the estimated total pages to actual current page count
    estimatedTotalPages = 4;
    addPageNumber(currentPageNumber, estimatedTotalPages);

    // After adding overall program recommendations and before adding final page number:
doc.addPage();
currentPageNumber++;

doc.fontSize(16).font("Helvetica-Bold")
   .text("List of Social Enterprises with Evaluations", 40, doc.y, { underline: true });
doc.moveDown(1);
doc.fontSize(10).font("Helvetica");

// ✅ Fetch social enterprises from DB that have evaluations
const client = await pgDatabase.connect();
let socialEnterprisesWithEvaluations = [];
try {
  const seQuery = `
    SELECT DISTINCT se.team_name
    FROM socialenterprises se
    JOIN evaluations e ON se.se_id = e.se_id
    ORDER BY se.team_name;
  `;
  const result = await client.query(seQuery);
  socialEnterprisesWithEvaluations = result.rows;
} catch (dbErr) {
  console.error("❌ Error fetching social enterprises for report:", dbErr);
} finally {
  client.release();
}

// ✅ Render the list
if (socialEnterprisesWithEvaluations.length > 0) {
  let listY = doc.y;
  socialEnterprisesWithEvaluations.forEach((se, index) => {
    // Add new page if needed
    if (listY > doc.page.height - doc.page.margins.bottom - 20) {
      addPageNumber(currentPageNumber, estimatedTotalPages);
      doc.addPage();
      currentPageNumber++;
      listY = doc.y;
    }
    doc.text(`${index + 1}. ${se.team_name}`, 50, listY, { width: 700 });
    listY += 14;
  });
} else {
  doc.text("No social enterprises with evaluations found.", 50, doc.y);
}

// ✅ Update total pages count and add page number
estimatedTotalPages = currentPageNumber;
addPageNumber(currentPageNumber, estimatedTotalPages);


    doc.end();
  } catch (err) {
    console.error("❌ Error generating overall evaluation report:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});


// Updated Adhoc Report Route (Evaluation Report)
app.post("/api/adhoc-report", async (req, res) => {
  try {
    const { chartImageRadar, chartImagePie, se_id, period, scoreDistributionLikert } = req.body;
    if (!chartImageRadar || !chartImagePie || !scoreDistributionLikert) {
      return res.status(400).json({ message: "Missing chart image(s)" });
    }

    const imageBuffer = Buffer.from(chartImageRadar.split(",")[1], "base64");
    const pieBuffer = Buffer.from(chartImagePie.split(",")[1], "base64");
    const likertBuffer = Buffer.from(scoreDistributionLikert.split(",")[1], "base64");

    const performanceOverviewResult = await getPerformanceOverviewBySEID(se_id);
    const avgEvaluationScore = await avgRatingPerSE(se_id);
    const numberOfEvaluations = await getTotalEvaluationCount(se_id);
    const socialEnterpriseDetails = await getSocialEnterpriseByID(se_id)

    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=adhoc_report.pdf`,
      });
      res.send(pdfBuffer);
    });

    // Declare variables for page numbering
    let estimatedTotalPages = 4;
    let currentPageNumber = 1;

    // Helper function to add page number to current page
    const addPageNumber = (pageNum, totalPages) => {
      const pageWidth = doc.page.width;
      const margin = doc.page.margins.top;
      
      const currentFontSize = doc._fontSize;
      
      doc.fontSize(10)
        .fillColor('black') // Changed from gray to black
        .text(`Page ${pageNum} of ${totalPages}`, 
              pageWidth - 120,
              margin - 20,
              { align: 'right', width: 100 });
      
      doc.fontSize(currentFontSize);
      doc.fillColor('black');
    };

    // ─── PAGE 1: TITLE AND OVERVIEW ───
    
    // Title Section
    doc.fontSize(20).fillColor('black').text(`${socialEnterpriseDetails.team_name} Analytics Report`, { align: "center" });
    doc.fontSize(12);

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.fillColor('black').text(`Generated as of ${formattedDate}`, { align: "left" });

    // Column positions
    const leftColX = 40;
    const rightColX = 350;
    const sectionTopY = 80;
    let leftY = sectionTopY;
    let rightY = sectionTopY;

    // Left Column
    doc.fillColor('black').text(`Average Evaluation Score: ${avgEvaluationScore[0]?.avg_rating || "N/A"}`, leftColX, leftY);
    leftY += 16;
    doc.fillColor('black').text(`Number of Evaluations: ${numberOfEvaluations[0]?.total_evaluations || "N/A"}`, leftColX, leftY);

    // Move below taller column
    doc.y = Math.max(leftY, rightY) + 20;

    // Analytics Section
    doc.fontSize(16).fillColor('black').text("Analytics Summary", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(14).fillColor('black').text("Performance Overview");
    doc.moveDown(0.5);
    doc.image(imageBuffer, { fit: [700, 180], align: "center" });
    doc.moveDown(1);

    // Bottom Section: 2-Column Layout
    const startY = doc.y;
    const boxWidth = 250;
    const boxHeight = 45;
    const boxSpacingY = 10;
    const col1X = 40;
    const col2X = col1X + boxWidth + 20;
    const boxesPerColumn = 3;

    performanceOverviewResult.slice(0, 6).forEach((item, index) => {
      const col = Math.floor(index / boxesPerColumn);
      const row = index % boxesPerColumn;
      const x = col === 0 ? col1X : col2X;
      const y = startY + row * (boxHeight + boxSpacingY);

      doc.rect(x, y, boxWidth, boxHeight).strokeColor('black').stroke(); // Changed stroke color to black
      doc.fontSize(9).fillColor('black') // Changed text color to black
        .text(`Category: ${item.category}`, x + 10, y + 10)
        .text(`Score: ${item.score}`, x + 10, y + 25);
    });

    // Insights Section
    const strengths = performanceOverviewResult.filter(r => r.score > 3).map(r => r.category);
    const weaknesses = performanceOverviewResult.filter(r => r.score <= 3).map(r => r.category);
    const insightX = col2X + boxWidth + 40;
    let insightY = startY;

    doc.fontSize(12).fillColor('black').text("Insights", insightX, insightY);
    insightY += 20;

    doc.fontSize(10).fillColor('black').text("Strengths:", insightX, insightY);
    insightY += 15;
    if (strengths.length > 0) {
      strengths.forEach((s) => {
        doc.fillColor('black').text(`• ${s}`, insightX + 10, insightY);
        insightY += 14;
      });
    } else {
      doc.fillColor('black').text("• None", insightX + 10, insightY);
      insightY += 14;
    }

    insightY += 10;
    doc.fillColor('black').text("Weaknesses:", insightX, insightY);
    insightY += 15;
    if (weaknesses.length > 0) {
      weaknesses.forEach((w) => {
        doc.fillColor('black').text(`• ${w}`, insightX + 10, insightY);
        insightY += 14;
      });
    } else {
      doc.fillColor('black').text("• None", insightX + 10, insightY);
    }

    addPageNumber(currentPageNumber, estimatedTotalPages);

    // ─── PAGE 2: RECURRING ISSUES ───
    doc.addPage();
    currentPageNumber++;
    
    doc.fontSize(14).fillColor('black').text("Recurring Issues", { align: "left" });
    doc.moveDown(1);
    doc.image(pieBuffer, { fit: [700, 400], align: "center", valign: "top" });
    doc.moveDown(2);

    const commonChallenges = await getCommonChallengesBySEID(se_id);
    const mainKeyPainPoint = commonChallenges.reduce((max, item) => {
      const score = item.count * item.percentage;
      const maxScore = max.count * max.percentage;
      return score > maxScore ? item : max;
    });

    const startYPage2 = doc.y;
    const leftX = 40;
    const rightX = 400;
    const boxSpacingYPage2 = 10;
    const maxWidth = 320;

    doc.fontSize(12).fillColor('black').text("Common Challenges", leftX, startYPage2, { underline: true });
    doc.fillColor('black').text("Insights", rightX, startYPage2, { underline: true });

    let leftYPage2 = startYPage2 + 20;
    let rightYPage2 = startYPage2 + 20;
    doc.fontSize(10);

    for (const item of commonChallenges) {
      const isMain = item.category === mainKeyPainPoint.category && item.comment === mainKeyPainPoint.comment;
      const challengeText = `${item.percentage}% of recurring issues relate to ${item.category}, where evaluators cited "${item.comment}" in ${item.count} evaluations.`;

      if (isMain) {
        doc.font("Helvetica-Bold").fillColor("red").text("Main Key Pain Point", leftX, leftYPage2);
        leftYPage2 += 14;
        doc.font("Helvetica").fillColor("black");
      }

      doc.fillColor('black').text(challengeText, leftX, leftYPage2, {
        width: maxWidth,
        align: "left",
        lineGap: 2,
      });

      const hLeft = doc.heightOfString(challengeText, { width: maxWidth });
      leftYPage2 += hLeft + boxSpacingYPage2;

      // Insight logic (keeping the existing logic)
      const cat = item.category;
      const comment = item.comment.toLowerCase();
      let insight = "";

      if (cat === "Teamwork") {
        insight = comment.includes("not participating")
          ? "Teamwork appears to be a key pain point, with many members not contributing. This suggests a need to foster collaboration and engagement."
          : "Challenges in teamwork reflect gaps in group dynamics or morale—team-building may help.";
      } else if (cat === "Financial Planning/Management") {
        insight = comment.includes("no reports")
          ? "Financial systems are underdeveloped. Foundational financial tracking and planning should be established."
          : "Some financial efforts exist but remain incomplete—follow-through on reports and structured planning is needed.";
      } else if (cat === "Marketing Plan/Execution") {
        insight = comment.includes("no plans")
          ? "Marketing strategy is lacking entirely. Guidance in planning and outreach is needed."
          : "Marketing has started but lacks execution—support in turning ideas into action could be beneficial.";
      } else if (cat === "Product/Service Design/Planning") {
        insight = comment.includes("no reports")
          ? "Product/Service planning is missing. Consider starting with basic reporting and design planning."
          : "Initial product/service documentation exists but needs structure and completion.";
      } else if (cat === "Human Resource Management") {
        insight = comment.includes("no reports")
          ? "HR processes are undeveloped—efforts should be made to draft plans and define HR practices."
          : "There is some HR planning effort, but documentation is lacking—follow-through and organization are key.";
      } else if (cat === "Logistics") {
        insight = comment.includes("no plans")
          ? "Logistics is a major issue, with a complete lack of plans—basic logistical mapping and coordination tools should be introduced."
          : "Some logistics planning exists, but execution is weak—focus on implementing existing plans.";
      } else {
        insight = `The category "${cat}" shows notable underperformance—mentorship and structured planning are recommended.`;
      }

      if (isMain) doc.font("Helvetica-Bold").fillColor("red");
      doc.text(insight, rightX, rightYPage2, {
        width: maxWidth,
        align: "left",
        lineGap: 2,
      });
      const hRight = doc.heightOfString(insight, { width: maxWidth });
      rightYPage2 += hRight + boxSpacingYPage2;
      if (isMain) doc.font("Helvetica").fillColor("black");
    }

    addPageNumber(currentPageNumber, estimatedTotalPages);

    // ─── PAGE 3: RATING DISTRIBUTION ───
    doc.addPage();
    currentPageNumber++;
    
    doc.fontSize(14).fillColor('black').text("Category Score Distribution", { align: "left" });
    doc.moveDown(1);

    // Chart
    doc.image(likertBuffer, {
      fit: [700, 300],
      align: "center",
      valign: "top",
    });
    doc.moveDown(2);

    // Fetch ratings
    const rawRatings = await getPermanceScoreBySEID(se_id);
    const ratingGrouped = {};
    rawRatings.forEach(({ category_name, rating, rating_count }) => {
      if (!ratingGrouped[category_name]) ratingGrouped[category_name] = {};
      ratingGrouped[category_name][rating] = parseInt(rating_count);
    });

    // Layout config
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const scoreDistributionScoreLeftAxis = 40;
    const scoreDistributionGapY = 10;
    const columnWidth = 180;
    const blockHeight = 90;
    const columnsPerRow = 3;

    doc.fontSize(12).fillColor('black').text("Score Breakdown", scoreDistributionScoreLeftAxis, doc.y, { underline: true });
    doc.moveDown(1);
    doc.fontSize(10);

    const categories = Object.entries(ratingGrouped);
    categories.forEach(([category, ratings], index) => {
      const col = index % columnsPerRow;
      const row = Math.floor(index / columnsPerRow);
      const x = scoreDistributionScoreLeftAxis + col * columnWidth;
      const y = 350 + row * blockHeight;

      doc.font("Helvetica-Bold").fillColor('black').text(category, x, y); // Changed to black

      for (let r = 1; r <= 5; r++) {
        const count = ratings[r] || 0;
        doc.font("Helvetica").fillColor('black').text(`${r} Star: ${count}`, x + 15, y + r * 12); // Changed to black
      }
    });

    addPageNumber(currentPageNumber, estimatedTotalPages);

    // ─── PAGE 4: INSIGHTS ───
    doc.addPage();
    currentPageNumber++;
    
    const page4AxisX = 40;
    const page4AxisY = doc.y;
    const page4MaxWidth = 520;
    const page4GapY = 10;
    const page4Height = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

    doc.fontSize(12).fillColor('black').text("Insights", page4AxisX, page4AxisY, { underline: true });
    doc.moveDown(1);
    doc.fontSize(10);
    let currentPage4Y = doc.y + 10;

    // Advice Map
    const categoryAdviceMap = {
      "Marketing Plan/Execution": "Consider building a structured marketing roadmap, including branding, channels, and timeline execution.",
      "Teamwork": "Group dynamics might need improvement—explore peer motivation, accountability practices, and better communication norms.",
      "Logistics": "To streamline operations, evaluate supply chain workflows and introduce tools for scheduling or delivery optimization.",
      "Financial Planning/Management": "Ensure budgeting, reporting, and forecasting frameworks are in place and consistently followed.",
      "Product/Service Design/Planning": "Encourage user feedback loops, prototyping cycles, and iteration strategies.",
      "Human Resource Management": "Consider formalizing recruitment, training, and performance appraisal systems.",
    };

    // Generate insights
    for (const [category, ratings] of Object.entries(ratingGrouped)) {
      const total = Object.values(ratings).reduce((sum, val) => sum + val, 0);
      const weighted = Object.entries(ratings).reduce(
        (acc, [r, c]) => acc + parseInt(r) * c,
        0
      );
      const average = total > 0 ? (weighted / total).toFixed(2) : "N/A";

      const score1 = ratings[1] || 0;
      const score2 = ratings[2] || 0;
      const score3 = ratings[3] || 0;
      const score4 = ratings[4] || 0;
      const score5 = ratings[5] || 0;

      // Determine key remark
      let remark = "";
      if (average >= 4 && score4 + score5 >= total * 0.7) {
        remark = "Strong performance with most evaluators awarding high marks. The SE demonstrates confidence and consistency in this area.";
      } else if (average >= 4) {
        remark = "Generally strong area, though a few ratings suggest opportunities to reach excellence with more consistency.";
      } else if (average >= 3) {
        if (score1 + score2 >= total * 0.3) {
          remark = "Mixed performance. While some scores are favorable, a notable proportion of low ratings suggests deeper inconsistencies.";
        } else {
          remark = "Moderate strength. There is foundational capability here, but enhancements could help reach best-in-class execution.";
        }
      } else if (average <= 2) {
        remark = "This category is underperforming. A high concentration of low scores indicates a need for structured support and attention.";
      } else {
        remark = "Inconsistent performance. Low and mid-tier ratings dominate—suggests unclear processes or insufficient capability.";
      }

      const advice = categoryAdviceMap[category] ? ` ${categoryAdviceMap[category]}` : "";

      // Combine and format the insight block
      const title = `${category}`;
      const avgLine = `Average Score: ${average} / 5`;
      const fullInsight = `${remark}${advice}`;

      const titleHeight = doc.heightOfString(title, { width: page4MaxWidth });
      const avgLineHeight = doc.heightOfString(avgLine, { width: page4MaxWidth });
      const fullInsightHeight = doc.heightOfString(fullInsight, { width: page4MaxWidth });

      const totalHeight = titleHeight + avgLineHeight + fullInsightHeight + page4GapY;

      // Add new page if needed with proper page numbering
      if (currentPage4Y + totalHeight > page4Height) {
        addPageNumber(currentPageNumber, estimatedTotalPages);
        
        doc.addPage();
        currentPageNumber++;
        currentPage4Y = doc.y;
      }

      // Render
      doc.font("Helvetica-Bold").fillColor('black').text(title, page4AxisX, currentPage4Y, { width: page4MaxWidth });
      currentPage4Y += titleHeight;

      doc.font("Helvetica-Bold").fillColor('black').text(avgLine, page4AxisX, currentPage4Y, { width: page4MaxWidth });
      currentPage4Y += avgLineHeight;

      doc.font("Helvetica").fillColor('black').text(fullInsight, page4AxisX, currentPage4Y, {
        width: page4MaxWidth,
        lineGap: 2,
      });
      currentPage4Y += fullInsightHeight + page4GapY;
    }

    // Update estimated total pages and add page number to final page
    estimatedTotalPages = currentPageNumber;
    addPageNumber(currentPageNumber, estimatedTotalPages);

    doc.end();
  } catch (err) {
    console.error("❌ Error generating report:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});

// Updated Financial Report Route
app.post("/api/financial-report", async (req, res) => {
  try {
    const {
      chartImage,
      selectedSEId,
      totalRevenue,
      totalExpenses,
      netIncome,
      totalAssets,
      selectedSERevenueVsExpensesData,
      cashFlowImage,
      transformedCashFlowData,
      equityImage,
      selectedSEEquityTrendData,
      inventoryTurnoverByItemData,
      netProfitMargin,
      grossProfitMargin,
      debtToAssetRatio
    } = req.body;

    if (!chartImage || !selectedSEId) {
      return res.status(400).json({ message: "Missing required data" });
    }

    const socialEnterpriseDetails = await getSocialEnterpriseByID(selectedSEId);
    const chartBuffer = Buffer.from(chartImage.split(",")[1], "base64");

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 40,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${selectedSEId}_Financial_Report.pdf`,
      });
      res.send(pdfBuffer);
    });

    // Declare variables for page numbering
    let estimatedTotalPages = 4;
    let currentPageNumber = 1;

    // Helper function to add page number to current page
    const addPageNumber = (pageNum, totalPages) => {
      const pageWidth = doc.page.width;
      const margin = doc.page.margins.top;
      
      const currentFontSize = doc._fontSize;
      
      doc.fontSize(10)
        .fillColor('black') // Changed from gray to black
        .text(`Page ${pageNum} of ${totalPages}`, 
              pageWidth - 120,
              margin - 20,
              { align: 'right', width: 100 });
      
      doc.fontSize(currentFontSize);
      doc.fillColor('black');
    };

    // Helper function to display "No Data Available" message
    const displayNoDataMessage = (title) => {
      const currentY = doc.y;
      const boxHeight = 200;
      const boxWidth = 700;
      const centerX = (doc.page.width - boxWidth) / 2;
      
      // Draw a black border instead of light gray
      doc.rect(centerX, currentY, boxWidth, boxHeight)
         .strokeColor('black')
         .stroke();
      
      // Add "No Data Available" text in center with black color
      doc.fontSize(16)
         .fillColor('black') // Changed from gray to black
         .text('No Data Available', 
               centerX, 
               currentY + (boxHeight / 2) - 10, 
               { width: boxWidth, align: 'center' });
      
      doc.fillColor('black');
      doc.y = currentY + boxHeight + 10;
    };

    // ─── PAGE 1: TITLE & SUMMARY ───
    
    // Title & Summary
    doc.fontSize(20).fillColor('black').text(`${socialEnterpriseDetails.team_name} Financial Report`, { align: "center" });
    doc.fontSize(12);
    doc.moveDown(0.5);

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.fillColor('black').text(`Generated as of ${formattedDate}`, { align: "left" });

    const leftColX = 40;
    let leftY = 90;

    doc.fillColor('black').text(`Total Revenue: Php ${Number(totalRevenue).toLocaleString()}`, leftColX, leftY);
    leftY += 16;
    doc.fillColor('black').text(`Total Expenses: Php ${Number(totalExpenses).toLocaleString()}`, leftColX, leftY);
    leftY += 16;
    doc.fillColor('black').text(`Net Income: Php ${Number(netIncome).toLocaleString()}`, leftColX, leftY);
    leftY += 16;
    doc.fillColor('black').text(`Total Assets: Php ${Number(totalAssets).toLocaleString()}`, leftColX, leftY);
    doc.moveDown(2);

    // Chart
    doc.fontSize(14).fillColor('black').text("Revenue vs Expenses Overview", { underline: true });
    doc.moveDown(1);
    
    // Check if chart data exists and is valid
    const hasRevenueExpenseData = selectedSERevenueVsExpensesData && 
                                 selectedSERevenueVsExpensesData.length > 0 &&
                                 selectedSERevenueVsExpensesData.some(series => series.data && series.data.length > 0);
    
    if (hasRevenueExpenseData && chartImage && chartBuffer) {
      try {
        doc.image(chartBuffer, {
          fit: [700, 200],
          align: "center",
        });
      } catch (imageError) {
        console.warn("Error displaying revenue/expense chart:", imageError);
        displayNoDataMessage("Revenue vs Expenses Overview");
      }
    } else {
      displayNoDataMessage("Revenue vs Expenses Overview");
      console.log("Missing data - Revenue/Expense chart:", { 
        hasData: hasRevenueExpenseData, 
        hasImage: !!chartImage,
        hasBuffer: !!chartBuffer 
      });
    }

    doc.moveDown(1.5);

    // Insights
    doc.fontSize(14).fillColor('black').text("Financial Insights", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);

    const insightsX = 40;
    const maxWidth = 700;
    const gapY = 14;
    let insightsY = doc.y;

    const insights = [];

    // General Metrics (keeping existing logic but ensuring black text)
    if (totalRevenue > totalExpenses) {
      insights.push("The enterprise is profitable overall, with revenues exceeding expenses.");
    } else {
      insights.push("Overall expenses exceed revenue, suggesting a deficit situation that warrants attention.");
    }

    if (netIncome < 0) {
      insights.push("Net income is negative, indicating a loss position. Consider reviewing cost and revenue drivers.");
    } else {
      insights.push("The enterprise reports a positive net income, reflecting a financially sound position.");
    }

    if (totalAssets > 0 && netIncome / totalAssets < 0.05) {
      insights.push("Return on assets is relatively low. Consider strategies to optimize asset utilization.");
    } else if (netIncome / totalAssets >= 0.05) {
      insights.push("Assets are generating good returns, indicating efficient resource deployment.");
    }

    // Time-Series Analysis (keeping existing logic)
    if (hasRevenueExpenseData) {
      const revenueSeries = selectedSERevenueVsExpensesData.find(s => s.id === "Revenue");
      const expenseSeries = selectedSERevenueVsExpensesData.find(s => s.id === "Expenses");

      if (revenueSeries && expenseSeries) {
        const revData = revenueSeries.data;
        const expData = expenseSeries.data;

        const revRecent = revData.slice(-2);
        const expRecent = expData.slice(-2);

        const [revQ1, revQ2] = revRecent.map(p => p.y);
        const [expQ1, expQ2] = expRecent.map(p => p.y);

        if (revQ2 > revQ1) {
          insights.push("Revenue increased in the most recent quarter, reflecting positive momentum.");
        } else if (revQ2 < revQ1) {
          insights.push("Revenue declined in the most recent quarter. Investigating underlying drivers is recommended.");
        } else {
          insights.push("Revenue remained flat in the last two quarters.");
        }

        if (expQ2 > expQ1) {
          insights.push("Expenses rose in the latest quarter. Monitoring cost controls is advised.");
        } else if (expQ2 < expQ1) {
          insights.push("Expenses declined recently. Cost-saving initiatives may be taking effect.");
        } else {
          insights.push("Expenses remained stable in the past two quarters.");
        }

        const maxRev = revData.reduce((a, b) => (a.y > b.y ? a : b));
        const minRev = revData.reduce((a, b) => (a.y < b.y ? a : b));
        insights.push(`The highest revenue was recorded in ${maxRev.x} (Php ${maxRev.y.toLocaleString()}).`);
        insights.push(`The lowest revenue occurred in ${minRev.x} (Php ${minRev.y.toLocaleString()}).`);

        const maxExp = expData.reduce((a, b) => (a.y > b.y ? a : b));
        const minExp = expData.reduce((a, b) => (a.y < b.y ? a : b));
        insights.push(`The highest expenses were in ${maxExp.x} (Php ${maxExp.y.toLocaleString()}).`);
        insights.push(`The lowest expenses occurred in ${minExp.x} (Php ${minExp.y.toLocaleString()}).`);

        const revVolatility = revData.map((v, i, arr) => i > 0 ? Math.abs(v.y - arr[i - 1].y) : 0).reduce((a, b) => a + b, 0);
        const expVolatility = expData.map((v, i, arr) => i > 0 ? Math.abs(v.y - arr[i - 1].y) : 0).reduce((a, b) => a + b, 0);

        if (revVolatility > expVolatility) {
          insights.push("Revenue has shown more variability than expenses over the reporting period.");
        } else if (revVolatility < expVolatility) {
          insights.push("Expenses have fluctuated more than revenue, possibly due to inconsistent cost drivers.");
        } else {
          insights.push("Revenue and expenses have fluctuated at a similar pace over time.");
        }
      }
    } else {
      insights.push("No revenue and expense trend data available for detailed analysis.");
    }

    // Render Insights in Three Independent Columns with black text
    const columnWidth = 220;
    const columnGap = 20;
    const totalColumns = 3;
    const columnX = [insightsX, insightsX + columnWidth + columnGap, insightsX + 2 * (columnWidth + columnGap)];
    const columnYs = [doc.y, doc.y, doc.y];

    insights.forEach((text, i) => {
      const colIndex = i % totalColumns;
      doc.fillColor('black').text(`• ${text}`, columnX[colIndex], columnYs[colIndex], {
        width: columnWidth,
        align: "left",
      });

      const textHeight = doc.heightOfString(`• ${text}`, { width: columnWidth });
      columnYs[colIndex] += textHeight + 6;
    });

    addPageNumber(currentPageNumber, estimatedTotalPages);

    // ─── PAGE 2: CASHFLOW ANALYSIS ───
    doc.addPage();
    currentPageNumber++;
    
    doc.fontSize(14).fillColor('black').text("Cashflow Analysis", { underline: true });
    doc.moveDown(1);

    // Check if cashflow data exists
    const hasCashFlowData = transformedCashFlowData && transformedCashFlowData.length > 0;
    
    // Cashflow Chart
    if (cashFlowImage && hasCashFlowData) {
      try {
        const cashFlowBuffer = Buffer.from(cashFlowImage.split(",")[1], "base64");
        doc.image(cashFlowBuffer, {
          fit: [700, 200],
          align: "center",
        });
        doc.moveDown(1.5);
      } catch (imageError) {
        console.warn("Error displaying cashflow chart:", imageError);
        displayNoDataMessage("Cashflow Chart");
        doc.moveDown(1.5);
      }
    } else {
      displayNoDataMessage("Cashflow Chart");
      console.log("Missing data - Cashflow chart:", { 
        hasImage: !!cashFlowImage, 
        hasData: hasCashFlowData 
      });
      doc.moveDown(1.5);
    }

    // Generate Cashflow Insights
    const cashflowData = transformedCashFlowData;
    const cashflowInsights = [];

    if (hasCashFlowData) {
      const highestInflow = cashflowData.reduce((a, b) => (a.Inflow > b.Inflow ? a : b));
      const highestOutflow = cashflowData.reduce((a, b) => (a.Outflow > b.Outflow ? a : b));

      const inflowOnly = cashflowData.filter(q => q.Inflow > 0).map(q => q.Inflow);
      const outflowOnly = cashflowData.filter(q => q.Outflow > 0).map(q => q.Outflow);

      if (inflowOnly.length > 0) {
        const avgInflow = inflowOnly.reduce((a, b) => a + b, 0) / inflowOnly.length;
        cashflowInsights.push(`Average inflow across reporting periods is Php ${Math.round(avgInflow).toLocaleString()}.`);
      }
      
      if (outflowOnly.length > 0) {
        const avgOutflow = outflowOnly.reduce((a, b) => a + b, 0) / outflowOnly.length;
        cashflowInsights.push(`Average outflow across reporting periods is Php ${Math.round(avgOutflow).toLocaleString()}.`);
      }

      cashflowInsights.push(`The highest recorded cash inflow was in ${highestInflow.quarter} (Php ${highestInflow.Inflow.toLocaleString()}).`);
      cashflowInsights.push(`The highest recorded cash outflow was in ${highestOutflow.quarter} (Php ${highestOutflow.Outflow.toLocaleString()}).`);

      if (inflowOnly.length > 0 && outflowOnly.length > 0) {
        const avgInflow = inflowOnly.reduce((a, b) => a + b, 0) / inflowOnly.length;
        const avgOutflow = outflowOnly.reduce((a, b) => a + b, 0) / outflowOnly.length;
        
        if (avgInflow > avgOutflow) {
          cashflowInsights.push("Overall cash position is positive with average inflows exceeding outflows.");
        } else if (avgInflow < avgOutflow) {
          cashflowInsights.push("Enterprise is in a negative cashflow situation—monitor spending and improve revenue inflows.");
        } else {
          cashflowInsights.push("Average inflows and outflows are balanced. Sustaining this may require tight operational controls.");
        }
      }

      const q1 = cashflowData[cashflowData.length - 2];
      const q2 = cashflowData[cashflowData.length - 1];
      if (q1 && q2) {
        if (q2.Inflow > q1.Inflow) {
          cashflowInsights.push("Cash inflow improved in the recent quarter.");
        } else if (q2.Inflow < q1.Inflow) {
          cashflowInsights.push("Cash inflow declined in the latest quarter.");
        }

        if (q2.Outflow > q1.Outflow) {
          cashflowInsights.push("Cash outflow increased in the recent quarter—monitor financial controls.");
        } else if (q2.Outflow < q1.Outflow) {
          cashflowInsights.push("Cash outflow reduced this quarter, indicating possible operational efficiency.");
        }
      }
    } else {
      cashflowInsights.push("No cashflow data available for analysis.");
    }

    // Render Cashflow Insights with black text
    doc.fontSize(14).fillColor('black').text("Cashflow Insights", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    let cashflowY = doc.y;

    cashflowInsights.forEach((text) => {
      doc.fillColor('black').text(`• ${text}`, insightsX, cashflowY, {
        width: maxWidth,
        align: "left",
      });
      cashflowY += gapY;
    });

    addPageNumber(currentPageNumber, estimatedTotalPages);

    // ─── PAGE 3: EQUITY ANALYSIS ───
    doc.addPage();
    currentPageNumber++;
    
    doc.fontSize(14).fillColor('black').text("Net Worth (Equity) Over Time", { underline: true });
    doc.moveDown(1);
    
    // Check if equity data exists
    const hasEquityData = selectedSEEquityTrendData && 
                         selectedSEEquityTrendData.length > 0 && 
                         selectedSEEquityTrendData[0]?.data && 
                         selectedSEEquityTrendData[0].data.length > 0;
    
    if (equityImage && hasEquityData) {
      try {
        const equityBuffer = Buffer.from(equityImage.split(",")[1], "base64");
        doc.image(equityBuffer, { fit: [700, 200], align: "center" });
        doc.moveDown(1.5);
      } catch (imageError) {
        console.warn("Error displaying equity chart:", imageError);
        displayNoDataMessage("Equity Trend Chart");
        doc.moveDown(1.5);
      }
    } else {
      displayNoDataMessage("Equity Trend Chart");
      console.log("Missing data - Equity chart:", { 
        hasImage: !!equityImage, 
        hasData: hasEquityData 
      });
      doc.moveDown(1.5);
    }

    doc.fontSize(14).fillColor('black').text("Equity Insights", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    let equityY = doc.y;
    const equityData = hasEquityData ? selectedSEEquityTrendData[0].data : [];
    const equityInsights = [];
    
    if (hasEquityData) {
      const sorted = [...equityData];
      const highest = sorted.reduce((a, b) => a.y > b.y ? a : b);
      const lowest = sorted.reduce((a, b) => a.y < b.y ? a : b);
      equityInsights.push(`Equity peaked in ${highest.x} at Php ${highest.y.toLocaleString()}, but declined afterwards.`);
      equityInsights.push(`The lowest equity value was in ${lowest.x} at Php ${lowest.y.toLocaleString()}, raising concerns on retained value.`);
      if (equityData.length >= 2) {
        const prev = equityData[equityData.length - 2];
        const curr = equityData[equityData.length - 1];
        if (curr.y > prev.y) equityInsights.push("Equity increased in the most recent quarter—potentially from profit or owner contribution.");
        else if (curr.y < prev.y) equityInsights.push("Equity declined in the recent quarter, possibly due to losses or withdrawals.");
      }
      equityInsights.push("Volatility in equity levels suggests instability in net worth—sustained growth strategy needed.");
      equityInsights.push("No consistent growth trend seen—investors may require reassurance on long-term value creation.");
    } else {
      equityInsights.push("No equity trend data available for analysis.");
    }
    
    equityInsights.forEach((text) => {
      doc.fillColor('black').text(`• ${text}`, insightsX, equityY, {
        width: maxWidth,
        align: "left",
      });
      equityY += gapY;
    });

    // Inventory Turnover Analysis (after Equity) with black text
    const inventoryInsights = [];
    if (inventoryTurnoverByItemData && inventoryTurnoverByItemData.length > 0) {
      const turnoverRates = inventoryTurnoverByItemData.map(i => i.turnover);
      const avgTurnover = turnoverRates.length
        ? turnoverRates.reduce((a, b) => a + b, 0) / turnoverRates.length
        : 0.1;

      inventoryInsights.push(`Average turnover rate across inventory: ${(avgTurnover * 100).toFixed(1)}%.`);

      inventoryTurnoverByItemData.forEach(item => {
        const rate = (item.turnover * 100).toFixed(1);
        if (item.turnover > avgTurnover * 1.25) {
          inventoryInsights.push(`- ${item.name}: Turnover at ${rate}%, significantly above average — strong sales.`);
        } else if (item.turnover < avgTurnover * 0.75) {
          inventoryInsights.push(`- ${item.name}: Turnover at ${rate}%, below average — monitor for slow movement.`);
        } else {
          inventoryInsights.push(`- ${item.name}: Turnover at ${rate}%, consistent with average.`);
        }
      });
    } else {
      inventoryInsights.push("No inventory turnover data available for analysis.");
    }

    addPageNumber(currentPageNumber, estimatedTotalPages);

    // ─── PAGE 4: STAKEHOLDER SUMMARY & INVESTMENT OUTLOOK ───
    doc.addPage();
    currentPageNumber++;
    
    doc.fontSize(14).fillColor('black').text("Stakeholder Summary & Investment Outlook", { underline: true });
    doc.moveDown(1);

    // Display Key Financial Ratios with black text
    doc.fontSize(12).fillColor('black').text("Key Financial Ratios", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    const displayRatio = (label, value) =>
      typeof value === "number" && !isNaN(value)
        ? `${label}: ${(value * 100).toFixed(2)}%`
        : `${label}: Data unavailable`;

    const keyRatios = [
      displayRatio("Net Profit Margin", netProfitMargin),
      displayRatio("Gross Profit Margin", grossProfitMargin),
      displayRatio("Debt-to-Asset Ratio", debtToAssetRatio),
    ];

    let ratioY = doc.y;
    keyRatios.forEach((line) => {
      doc.fillColor('black').text(`• ${line}`, 40, ratioY, { width: 700, align: "left" });
      ratioY += 14;
    });

    doc.moveDown(1);

    // Financial Outlook Insights with black text
    doc.fontSize(12).fillColor('black').text("Outlook Insights", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    const outlookInsights = generateDynamicOutlook({
      netIncome,
      totalAssets,
      transformedCashFlowData,
      selectedSEEquityTrendData,
      inventoryTurnoverByItemData,
      netProfitMargin,
      grossProfitMargin,
      debtToAssetRatio,
    });

    let outlookY = doc.y;
    outlookInsights.forEach((text) => {
      doc.fillColor('black').text(`• ${text}`, 40, outlookY, { width: 700, align: "left" });
      outlookY += 14;
    });

    // Update estimated total pages and add page number to final page
    estimatedTotalPages = currentPageNumber;
    addPageNumber(currentPageNumber, estimatedTotalPages);

    doc.end();
  } catch (err) {
    console.error("❌ Error generating financial report:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});



app.get("/api/mentor-critical-areas/:mentor_id", async (req, res) => {
  try {
    const { mentor_id } = req.params;

    if (!mentor_id) {
      return res.status(400).json({ message: "Mentor ID is required" });
    }

    const criticalAreas = await getCriticalAreasByMentorID(mentor_id);

    res.json({ criticalAreas });
  } catch (error) {
    console.error("❌ Error fetching mentor critical areas:", error);
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

app.get("/api/critical-areas/:se_id", async (req, res) => {
  try {
    const { se_id } = req.params;
    if (!se_id) return res.status(400).json({ message: "SE ID is required" });

    const areasOfFocus = await getAreasOfFocus(se_id);

    res.json(areasOfFocus)
  } catch (error) {
    console.error("Error fetching SE analytics stats:", error);
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

  const client = await pgDatabase.connect();

  try {
    await client.query("BEGIN");

    // Get mentor's name for the message
    const mentorResult = await client.query(
      "SELECT mentor_firstname, mentor_lastname FROM mentors WHERE mentor_id = $1",
      [mentorId]
    );

    if (mentorResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Mentor not found." });
    }

    const mentorName = `${mentorResult.rows[0].mentor_firstname} ${mentorResult.rows[0].mentor_lastname}`;

    // 1️⃣ Get chat IDs for this mentorship
    const chatResult = await client.query(
      `SELECT chatid FROM telegrambot WHERE mentor_id = $1 AND se_id = $2`,
      [mentorId, seId]
    );

    const chatIds = chatResult.rows.map(row => row.chatid);

    console.log(`Found ${chatIds.length} chat IDs to notify.`);

    // 2️⃣ Send Telegram notifications
    const messageText = `*NOTICE*\nYour mentorship with *${mentorName}* has been removed by LSEED.`;

    for (const chatId of chatIds) {
      await sendMessage(chatId, messageText);
    }

    // 3️⃣ Delete the chat IDs from the telegrambot table
    await client.query(
      `DELETE FROM telegrambot WHERE mentor_id = $1 AND se_id = $2`,
      [mentorId, seId]
    );

    // 4️⃣ Delete the mentorship record itself
    const deleteMentorshipResult = await client.query(
      `DELETE FROM mentorships WHERE mentor_id = $1 AND se_id = $2`,
      [mentorId, seId]
    );

    if (deleteMentorshipResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "No mentorship record found." });
    }

    await client.query("COMMIT");

    res.json({ success: true, message: "Mentorship removed and notifications sent." });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error removing mentorship:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  } finally {
    client.release();
  }
});

app.get("/getMentorshipsbyID", async (req, res) => {
  try {
    const { mentor_id } = req.query; // Extract mentor_id from query parameters

    if (!mentor_id) {
      return res.status(400).json({ message: "mentor_id is required" });
    }

    // Fetch mentorships based on mentor_id from the database
    const mentorships = await getMentorshipsForScheduling(mentor_id) // Assume this function exists in your DB logic

    if (!mentorships || mentorships.length === 0) {
      return res.status(404).json({ message: "No mentorships found for the given mentor_id" });
    }

    res.json(mentorships); // Send the mentorships data
  } catch (error) {
    console.error("Error fetching mentorships:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/getAvailableEvaluations", async (req, res) => {
  try {
    const mentor_id = req.session.user?.id;

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
app.get("/getAllPrograms", async (req, res) => {
  try {
    const programs = await getAllPrograms(); // Fetch programs from the controller
    res.json(programs); // Send the programs as JSON
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/list-se-applications", async (req, res) => {
  try {
    const applicationList = await getApplicationList();
    res.json(applicationList);
  } catch (error) {
    console.error("Error fetching application list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/list-mentor-applications", async (req, res) => {
  try {
    const applicationList = await getMentorFormApplications();
    res.json(applicationList);
  } catch (error) {
    console.error("Error fetching application list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT route to update application status
app.put("/api/application/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, email, team_name } = req.body;

  try {
    await pgDatabase.query(
      `UPDATE mentees_form_submissions SET status = $1 WHERE id = $2`,
      [status, id]
    );

    if (status.toLowerCase() === 'declined') {
      if (email) {
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: `"LSEED Center" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Update on Your Application to the LSEED Program',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
              <p>Dear ${team_name || "Your"} Team,</p>
  
              <p>
                Thank you for your interest in the <strong>LSEED Center’s Social Enterprise Development Program</strong>.
              </p>
  
              <p>
                After careful review of your application, we regret to inform you that your team was not selected for this program cycle.
              </p>
  
              <p>
                This decision was not easy given the number of inspiring applications we received. While we are unable to offer a spot at this time, we sincerely appreciate the effort you put into your submission and your dedication to creating social impact.
              </p>
  
              <p>
                We encourage you to stay connected with us for future opportunities, workshops, and program cycles that may be a better fit.
              </p>
  
              <p>
                If you have any questions or would like feedback on your application, please feel free to reply to this email.
              </p>
  
              <p>
                Thank you again for your interest and commitment to meaningful change.
              </p>
  
              <p>
                Warm regards,<br/>
                The LSEED Team
              </p>
            </div>
          `,
        });
      } else {
        console.warn("⚠️ No focal_email provided; skipping email send.");
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Failed to update status:", error);
    res.sendStatus(500);
  }
});

// PUT route to update mentor application status
app.put("/mentor-application/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pgDatabase.query(
      `UPDATE mentor_form_application SET status = $1 WHERE id = $2`,
      [status, id]
    );
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Failed to update status:", error);
    res.sendStatus(500);
  }
});

// Notification is_read update
app.put("/api/notifications/:notificationId/read", async (req, res) => {
  const { notificationId } = req.params;

  try {
    await pgDatabase.query(
      `UPDATE notification SET is_read = true WHERE notification_id = $1`,
      [notificationId]
    );

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Failed to mark notification as read:", error);
    res.sendStatus(500);
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
    const program = req.query.program || null; // Optional program param

    const result = await getEvaluations(program);
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

    const rawContact = socialEnterpriseData.contactnum;
    const extractedEmail = extractEmailFromContactnum(rawContact);
    if (extractedEmail) {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: `"LSEED Center" <${process.env.EMAIL_USER}>`,
        to: extractedEmail,
        subject: 'Congratulations! Your Application to the LSEED Program Has Been Accepted',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
            <p>Dear ${socialEnterpriseData.name || "Your"} Team,</p>

            <p>
              Congratulations! Your application to join the <strong>LSEED Center’s Social Enterprise Development Program</strong> has been <strong>accepted</strong>.
            </p>

            <p>
              We are thrilled to welcome you to our community of changemakers and look forward to supporting your enterprise journey. As part of your onboarding, you will soon be assigned mentors, and we’ll coordinate your first mentorship sessions.
            </p>

            <p>
              Please keep an eye on your email for further instructions regarding:
            </p>

            <ul>
              <li>Joining the official <strong>Telegram group</strong> for communications</li>
              <li>Details about your <strong>onboarding session</strong></li>
            </ul>

            <p>
              If you have any questions or updates regarding your team, please don't hesitate to contact us at this email address.
            </p>

            <p>
              Once again, congratulations and welcome to the LSEED family!
            </p>

            <p>
              Warm regards,<br/>
              The LSEED Team
            </p>
          </div>
        `,
      });
    } else {
      console.warn("⚠️ No focal_email provided; skipping email send.");
    }
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
    const { period, program } = req.query; // Get period from query params
    const result = await getStatsForHeatmap(period, program);

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

app.post("/webhook-bot1", async (req, res) => {
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

        if (userStates[chatId]?.state === "awaiting_password") {
          const enteredPassword = message.text.trim().toLowerCase();

          // Step 1: Fetch current valid password from database
          const { rows } = await pgDatabase.query(`
            SELECT password FROM signup_passwords
            WHERE NOW() BETWEEN valid_from AND valid_until
            LIMIT 1
          `);

          const currentPassword = rows[0]?.password?.toLowerCase();

          if (enteredPassword === currentPassword) {
            setUserState(chatId, "awaiting_program_selection"); // Transition to program selection

            if (formattedOptions.length === 0) {
              await sendMessage(
                chatId,
                "⚠️ No programs available at the moment. Please try again later."
              );
              delete userStates[chatId]; // Reset state
              return res.sendStatus(200);
            }

            const confirmationMessage = await sendMessageWithOptions(
              chatId,
              "✅ Password correct! You have been successfully registered.\n\nPlease choose your program:",
              formattedOptions
            );

            userStates[chatId] = {
              confirmationMessageId: confirmationMessage?.message_id || null
            };

            return res.sendStatus(200);
          } else {
            await sendMessage(chatId, "❌ Incorrect password. Please try again.");
            return res.sendStatus(200);
          }
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

            // 1. Get evaluation details to find mentor_id and se_id
            const evaluationDetailsQuery = `
                  SELECT mentor_id, se_id
                  FROM evaluations
                  WHERE evaluation_id = $1;
              `;
            const evalResult = await pgDatabase.query(evaluationDetailsQuery, [evaluationId]);

            if (evalResult.rows.length > 0) {
              const { mentor_id, se_id } = evalResult.rows[0];

              // 2. Get social enterprise team name
              const seNameQuery = `
                      SELECT team_name FROM socialenterprises WHERE se_id = $1;
                  `;
              const seNameResult = await pgDatabase.query(seNameQuery, [se_id]);
              const seName = seNameResult.rows[0]?.team_name || "Unknown Social Enterprise";

              // 3. Construct notification title
              const notificationTitle = `Evaluation Acknowledged by ${seName}`;
              const notificationMessage = `Your evaluation for ${seName} has been acknowledged.`

              // 4. Insert notification for the mentor
              await pgDatabase.query(
                `INSERT INTO notification (notification_id, receiver_id, se_id, title, message, created_at, target_route)
                      VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/assess');`,
                [mentor_id, se_id, notificationTitle, notificationMessage]
              );
              console.log(`🔔 Notification sent to mentor ${mentor_id}: Evaluation for ${seName} acknowledged.`);
            } else {
              console.warn(`⚠️ Evaluation with ID ${evaluationId} not found for mentor notification.`);
            }


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
                          ms.status, ms.zoom_link, mt.mentor_id
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

            //NOTIFICATION HERE
            // ✅ After all messages sent, insert ONE notification for the mentor
            const notificationTitle = `Confirmed Mentoring Session`;
            const notificationMessage = `${sessionDetails.team_name} has accepted your proposed schedule. Your upcoming mentoring session is on ${sessionDetails.mentoring_session_date} at ${sessionDetails.mentoring_session_time}.`;

            await pgDatabase.query(
              `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
                VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/scheduling');`,
              [sessionDetails.mentor_id, notificationTitle, notificationMessage]
            );

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

            // Inline keyboard for Accept/Decline
            const options = [
              [
                { text: `📅 Suggest New Schedule`, callback_data: `suggestnewschedule_${mentoring_session_id}` },
                { text: `❌ Cancel`, callback_data: `cancel_${mentoring_session_id}` }
              ]
            ];

            const sentSuggestSchedule = await sendMessageWithOptions(
              chatId,
              "📅 Would you like to suggest a new mentoring session schedule?",
              options
            );

            userStates[chatId] = { sentSuggestScheduleId: sentSuggestSchedule?.message_id };

            res.sendStatus(200);
            return;
          } catch (error) {
            console.error("❌ Error handling decline:", error);
            console.log("🛑 Error Stack:", error.stack);
            await sendMessage(chatId, "❌ Failed to process decline.");
            return res.sendStatus(500);
          }
        }

        if (data.startsWith("suggestnewschedule_")) {
          const parts = data.split("_");

          await deletePreviousMessages(chatId, ["sentSuggestScheduleId"]);

          if (parts.length < 2) {
            console.error("❌ Invalid suggest callback format:", data);
            return res.sendStatus(400);
          }

          const mentoring_session_id = parts[1];
          const messageId = callbackQuery.message.message_id;

          console.log(`🔹 Starting suggest new schedule for mentoring session ${mentoring_session_id}`);
          console.log(`📌 Chat ID: ${chatId}, Message ID: ${messageId}`);

          // ✅ Build month options
          const now = new Date();
          const currentMonthIndex = now.getMonth();
          const currentYear = now.getFullYear();

          const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];

          // Prepare userState storage for month mapping
          if (!userStates[chatId]) userStates[chatId] = {};
          userStates[chatId].monthChoices = {};

          const inlineMonthOptions = [];
          for (let i = 0; i < 6; i++) {
            const monthIndex = (currentMonthIndex + i) % 12;
            const yearOffset = Math.floor((currentMonthIndex + i) / 12);
            const year = currentYear + yearOffset;

            // ✅ Store the real month/year mapping in userState
            userStates[chatId].monthChoices[i] = {
              monthIndex,
              monthName: monthNames[monthIndex],
              year
            };

            // ✅ Make button callback short
            inlineMonthOptions.push([
              {
                text: `📅 ${monthNames[monthIndex]} ${year}`,
                callback_data: `selectday_${i}_${mentoring_session_id}`
              }
            ]);
          }

          // ✅ Send the month picker message
          const sentMonthPicker = await sendMessageWithOptions(
            chatId,
            "📅 Please choose the month for your new mentoring session schedule:",
            inlineMonthOptions
          );

          userStates[chatId].sentMonthPickerId = sentMonthPicker?.message_id;

          return res.sendStatus(200);
        }

        if (data.startsWith("selectday_")) {
          const parts = data.split("_");

          await deletePreviousMessages(chatId, ["sentMonthPickerId"]);

          if (parts.length < 3) {
            console.error("❌ Invalid selectday callback format:", data);
            return res.sendStatus(400);
          }

          const choiceIndex = parseInt(parts[1], 10);
          const mentoring_session_id = parts[2];
          const messageId = callbackQuery.message.message_id;

          console.log(`🔹 User chose month index: ${choiceIndex} for session ${mentoring_session_id}`);
          console.log(`📌 Chat ID: ${chatId}, Message ID: ${messageId}`);

          // ✅ Retrieve the actual month/year from userState
          const monthChoice = userStates[chatId]?.monthChoices?.[choiceIndex];
          if (!monthChoice) {
            console.error("❌ Invalid or expired month choice index:", choiceIndex);
            return res.sendStatus(400);
          }

          const selectedMonthName = monthChoice.monthName;
          const selectedYear = monthChoice.year;
          const selectedMonthIndex = monthChoice.monthIndex;

          console.log(`✅ Resolved month: ${selectedMonthName} ${selectedYear}`);

          // ✅ Figure out valid day range
          const now = new Date();
          const isCurrentMonthAndYear =
            (selectedYear === now.getFullYear() && selectedMonthIndex === now.getMonth());

          const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
          const startDay = isCurrentMonthAndYear ? now.getDate() : 1;

          // ✅ Save chosen month/year in userState for later use
          if (!userStates[chatId]) userStates[chatId] = {};
          userStates[chatId].selectedMonthName = selectedMonthName;
          userStates[chatId].selectedYear = selectedYear;
          userStates[chatId].mentoringSessionId = mentoring_session_id;

          // ✅ Build day buttons
          const inlineDayOptions = [];
          for (let d = startDay; d <= daysInMonth; d++) {
            inlineDayOptions.push([
              {
                text: `📅 ${d}`,
                callback_data: `selecttime_${d}`
              }
            ]);
          }

          // ✅ Send the day picker
          const sentDayPicker = await sendMessageWithOptions(
            chatId,
            `📅 Please choose a day in ${selectedMonthName} ${selectedYear}:`,
            inlineDayOptions
          );

          userStates[chatId].sentDayPickerId = sentDayPicker?.message_id;

          return res.sendStatus(200);
        }

        if (data.startsWith("selecttime_")) {
          const parts = data.split("_");

          await deletePreviousMessages(chatId, ["sentDayPickerId"]);

          if (parts.length < 2) {
            console.error("❌ Invalid selecttime callback format:", data);
            return res.sendStatus(400);
          }

          const selectedDay = parseInt(parts[1], 10);
          const messageId = callbackQuery.message.message_id;

          console.log(`🔹 User chose day: ${selectedDay}`);
          console.log(`📌 Chat ID: ${chatId}, Message ID: ${messageId}`);

          // ✅ Get month/year/sessionId from userState
          const userState = userStates[chatId];
          if (!userState || !userState.selectedMonthName || !userState.selectedYear || !userState.mentoringSessionId) {
            console.error("❌ Missing context in userStates");
            await sendMessage(chatId, "⚠️ Sorry, something went wrong. Please start the scheduling process again.");
            return res.sendStatus(400);
          }

          const selectedMonthName = userState.selectedMonthName;
          const selectedYear = userState.selectedYear;
          const mentoring_session_id = userState.mentoringSessionId;

          console.log(`✅ Resolved full date: ${selectedDay} ${selectedMonthName} ${selectedYear} for session ${mentoring_session_id}`);

          // ✅ Determine month index
          const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          const selectedMonthIndex = monthNames.indexOf(selectedMonthName);

          if (selectedMonthIndex === -1) {
            console.error("❌ Invalid month name in userState:", selectedMonthName);
            return res.sendStatus(400);
          }

          // ✅ Define all available time slots
          const allTimeSlots = [
            "08:00", "09:00", "10:00",
            "11:00", "12:00", "13:00",
            "14:00", "15:00", "16:00", "17:00"
          ];

          // ✅ Filter time slots if the day is today
          const now = new Date();
          const isToday =
            selectedYear === now.getFullYear() &&
            selectedMonthIndex === now.getMonth() &&
            selectedDay === now.getDate();

          const validTimeSlots = allTimeSlots.filter(timeStr => {
            if (!isToday) return true;
            const [hours, minutes] = timeStr.split(":").map(Number);
            if (hours > now.getHours()) return true;
            if (hours === now.getHours() && minutes > now.getMinutes()) return true;
            return false;
          });

          if (validTimeSlots.length === 0) {
            await sendMessageWithOptions(
              chatId,
              "❗️ No available time slots remaining for today. Please choose another day.",
              [
                [
                  { text: "🔙 Back to Months", callback_data: `suggestnewschedule_${mentoring_session_id}` }
                ]
              ]
            );
            return res.sendStatus(200);
          }

          // ✅ Store selected day in userState
          userState.selectedDay = selectedDay;

          // ✅ Build time buttons
          const inlineTimeOptions = validTimeSlots.map(timeStr => ([
            {
              text: `🕒 ${formatTimeLabel(timeStr)}`,
              callback_data: `selectEndTime_${timeStr}`
            }
          ]));

          // ✅ Send the time picker message
          const sentTimePicker = await sendMessageWithOptions(
            chatId,
            `🕒 Please choose a START time on ${selectedMonthName} ${selectedDay}, ${selectedYear}:`,
            inlineTimeOptions
          );

          userStates[chatId].sentTimePickerId = sentTimePicker?.message_id;

          return res.sendStatus(200);
        }

        if (data.startsWith("selectEndTime_")) {
          const parts = data.split("_");

          await deletePreviousMessages(chatId, ["sentTimePickerId"]);

          if (parts.length < 2) {
            console.error("❌ Invalid selectEndTime callback format:", data);
            return res.sendStatus(400);
          }

          const selectedStartTime = parts[1].trim();
          const messageId = callbackQuery.message.message_id;

          const userState = userStates[chatId];
          if (
            !userState ||
            !userState.selectedDay ||
            !userState.selectedMonthName ||
            !userState.selectedYear ||
            !userState.mentoringSessionId
          ) {
            console.error("❌ Missing context in userStates");
            await sendMessage(chatId, "⚠️ Something went wrong. Please start the scheduling again.");
            return res.sendStatus(400);
          }

          const selectedDay = userState.selectedDay;
          const selectedMonthName = userState.selectedMonthName;
          const selectedYear = userState.selectedYear;
          const mentoring_session_id = userState.mentoringSessionId;

          console.log(`🔹 User chose START time: ${selectedStartTime} on ${selectedDay} ${selectedMonthName} ${selectedYear} for session ${mentoring_session_id}`);
          console.log(`📌 Chat ID: ${chatId}, Message ID: ${messageId}`);

          const allTimeSlots = [
            "08:00", "09:00", "10:00",
            "11:00", "12:00", "13:00",
            "14:00", "15:00", "16:00", "17:00"
          ];

          function isTimeAfter(a, b) {
            const [aH, aM] = a.split(":").map(Number);
            const [bH, bM] = b.split(":").map(Number);
            return aH > bH || (aH === bH && aM > bM);
          }

          const validEndTimes = allTimeSlots.filter(timeStr => isTimeAfter(timeStr, selectedStartTime));

          if (validEndTimes.length === 0) {
            await sendMessageWithOptions(
              chatId,
              "❗️ No valid end times after that start time. Please choose an earlier start.",
              [[
                { text: "🔙 Back to Start Times", callback_data: `selecttime_${selectedDay}` }
              ]]
            );
            return res.sendStatus(200);
          }

          // ✅ Store selectedStartTime in userState
          userState.selectedStartTime = selectedStartTime;

          const inlineEndTimeOptions = validEndTimes.map(timeStr => ([
            {
              text: `🕒 ${formatTimeLabel(timeStr)}`,
              callback_data: `confirmschedule_${timeStr}`
            }
          ]));

          // ✅ Send the end time picker message
          const sentEndTimePicker = await sendMessageWithOptions(
            chatId,
            `🕒 Please choose an END time after ${formatTimeLabel(selectedStartTime)} on ${selectedMonthName} ${selectedDay}, ${selectedYear}:`,
            inlineEndTimeOptions
          );

          userStates[chatId].sentEndTimePickerId = sentEndTimePicker?.message_id;

          return res.sendStatus(200);
        }

        if (data.startsWith("confirmschedule_")) {
          const parts = data.split("_");

          await deletePreviousMessages(chatId, ["sentEndTimePickerId"]);

          if (parts.length < 2) {
            console.error("❌ Invalid confirmschedule callback format:", data);
            return res.sendStatus(400);
          }

          const selectedEndTime = parts[1].trim();
          const messageId = callbackQuery.message.message_id;

          const userState = userStates[chatId];
          if (
            !userState ||
            !userState.selectedStartTime ||
            !userState.selectedDay ||
            !userState.selectedMonthName ||
            !userState.selectedYear ||
            !userState.mentoringSessionId
          ) {
            console.error("❌ Missing context in userStates");
            await sendMessage(chatId, "⚠️ Something went wrong. Please start the scheduling again.");
            return res.sendStatus(400);
          }

          const selectedStartTime = userState.selectedStartTime;
          const selectedDay = userState.selectedDay;
          const selectedMonthName = userState.selectedMonthName;
          const selectedYear = userState.selectedYear;
          const mentoring_session_id = userState.mentoringSessionId;

          console.log(`🔹 User selected START ${selectedStartTime} and END ${selectedEndTime} on ${selectedDay} ${selectedMonthName} ${selectedYear} for session ${mentoring_session_id}`);
          console.log(`📌 Chat ID: ${chatId}, Message ID: ${messageId}`);

          // ✅ Store the end time in userState
          userState.selectedEndTime = selectedEndTime;

          // ✅ Build inline buttons
          const confirmOptions = [
            [
              {
                text: "✅ Confirm",
                callback_data: `saveSchedule_confirm`
              }
            ],
            [
              {
                text: "🔙 Pick Again",
                callback_data: `suggestnewschedule_${mentoring_session_id}`
              }
            ]
          ];

          // ✅ Send confirmation message
          const sentConfirm = await sendMessageWithOptions(
            chatId,
            `📌 Please confirm your suggested mentoring session schedule:\n\n` +
            `📅 *Date:* ${selectedMonthName} ${selectedDay}, ${selectedYear}\n` +
            `🕒 *Start:* ${formatTimeLabel(selectedStartTime)}\n` +
            `🕒 *End:* ${formatTimeLabel(selectedEndTime)}`,
            confirmOptions
          );

          userStates[chatId].sentSuggestScheduleId = sentConfirm?.message_id;

          return res.sendStatus(200);
        }

        if (data.startsWith("saveSchedule_confirm")) {
          await deletePreviousMessages(chatId, ["sentSuggestScheduleId"]);

          const userState = userStates[chatId];
          if (
            !userState ||
            !userState.selectedStartTime ||
            !userState.selectedEndTime ||
            !userState.selectedDay ||
            !userState.selectedMonthName ||
            !userState.selectedYear ||
            !userState.mentoringSessionId
          ) {
            console.error("❌ Missing schedule data in userStates");
            await sendMessage(chatId, "⚠️ Something went wrong. Please start the scheduling again.");
            return res.sendStatus(400);
          }

          const selectedStartTime = userState.selectedStartTime;
          const selectedEndTime = userState.selectedEndTime;
          const selectedDay = userState.selectedDay;
          const selectedMonthName = userState.selectedMonthName;
          const selectedYear = userState.selectedYear;
          const mentoring_session_id = userState.mentoringSessionId;
          const messageId = callbackQuery.message.message_id;

          console.log(`🔹 Saving schedule: START ${selectedStartTime}, END ${selectedEndTime}, DATE ${selectedDay} ${selectedMonthName} ${selectedYear} for session ${mentoring_session_id}`);
          console.log(`📌 Chat ID: ${chatId}, Message ID: ${messageId}`);

          // ✅ Convert month name to month index
          const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          const selectedMonthIndex = monthNames.indexOf(selectedMonthName);
          if (selectedMonthIndex === -1) {
            console.error("❌ Invalid month name:", selectedMonthName);
            return res.sendStatus(400);
          }

          // ✅ Format the date for storage as YYYY-MM-DD
          const monthNumber = String(selectedMonthIndex + 1).padStart(2, '0');
          const dayNumber = String(selectedDay).padStart(2, '0');
          const mentoringSessionDate = `${selectedYear}-${monthNumber}-${dayNumber}`;

          console.log(`✅ Formatted Date: ${mentoringSessionDate}`);

          try {
            const query = `
              SELECT mSess.mentoring_session_id, m.mentor_id, se.team_name
              FROM mentoring_session AS mSess
              JOIN mentorships AS ms ON mSess.mentorship_id = ms.mentorship_id
              JOIN socialenterprises AS se ON se.se_id = ms.se_id
              JOIN mentors AS m ON m.mentor_id = ms.mentor_id
              WHERE mSess.mentoring_session_id = $1;
            `;

            const { rows } = await pgDatabase.query(query, [mentoring_session_id]);

            if (rows.length === 0) {
              return res.status(404).json({ error: "Mentorship session not found" });
            }

            const row = rows[0];

            const notificationTitle = 'Your mentoring session has been declined';
            const notificationMessage =
              `${row.team_name} has declined your proposed mentoring session schedule, but suggested a new one:\n\n` +
              `📅 Date: ${selectedMonthName} ${selectedDay}, ${selectedYear}\n` +
              `🕒 Start: ${formatTimeLabel(selectedStartTime)}\n` +
              `🕒 End: ${formatTimeLabel(selectedEndTime)}\n\n` +
              `Please review this proposed schedule and appoint if available.`;

            await pgDatabase.query(
              `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
              VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/scheduling');`,
              [row.mentor_id, notificationTitle, notificationMessage]
            );

            // ✅ Notify the user
            await sendMessage(chatId,
              `✅ Your new proposed mentoring session schedule has been sent:\n\n` +
              `📅 *Date:* ${selectedMonthName} ${selectedDay}, ${selectedYear}\n` +
              `🕒 *Start:* ${formatTimeLabel(selectedStartTime)}\n` +
              `🕒 *End:* ${formatTimeLabel(selectedEndTime)}\n\n` +
              `The mentor will now review this proposed schedule.`
            );

            userStates[chatId] = {};  // clear temp state

            return res.sendStatus(200);
          } catch (error) {
            console.error("❌ Error saving new schedule:", error);
            await sendMessage(chatId, "❌ Failed to save the new schedule. Please try again.");
            return res.sendStatus(500);
          }
        }

        if (data.startsWith("cancel_")) {
          const parts = data.split("_");

          await deletePreviousMessages(chatId, ["sentSuggestScheduleId"]);

          if (parts.length < 2) {
            console.error("❌ Invalid decline callback format:", data);
            return res.sendStatus(400);
          }

          const mentoring_session_id = parts[1]; // Use mentoring_session_id instead of mentorship_id
          const messageId = callbackQuery.message.message_id;

          console.log(`🔹 Canceling suggesting a mentoring session ${mentoring_session_id}`);
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
                        ms.status, ms.zoom_link, mt.mentor_id
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

            //NOTIFICATION HERE
            // ✅ After all messages sent, insert ONE notification for the mentor
            const notificationTitle = `Mentoring Session Declined`;
            const notificationMessage = `${sessionDetails.team_name} has declined your proposed schedule. Please propose a new date and time for the mentoring session.`;

            await pgDatabase.query(
              `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
              VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/scheduling');`,
              [sessionDetails.mentor_id, notificationTitle, notificationMessage]
            );

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

app.post("/api/googleform-webhook", async (req, res) => {
  const formData = req.body;

  // Destructure fields from formData
  const {
    Timestamp,
    'Do you consent?': consent,
    'What is the name of your social enterprise?': team_name,
    'Do you have an existing abbreviation for your social enterprise?': se_abbreviation,
    'When did you start working on your social enterprise/social enterprise idea?': enterprise_idea_start,
    'How many people are directly involved in your social enterprise / social enterprise idea?': involved_people,
    'Kindly indicate the current phase of your social enterprise': current_phase,
    'What is the social problem that you are trying to address?': social_problem,
    'What is the nature of your social enterprise? Indicate your solution statement': se_nature,
    'Briefly describe what your Social Enterprise does, including the problem it addresses and how it creates impact.': se_description,
    'What do you think are the unique characteristics of your SE/Team?': team_characteristics,
    'What are the challenges that you face as a team?': team_challenges,
    'What area/s of business is/are the most critical for your SE/Team at present?  Please select all that apply.': critical_areas,
    'What are your action plans to address your current challenges?': action_plans,
    'How frequent do you meet as a team?': meeting_frequency,
    'What mode/s of communication is/are the most effective and readily available for majority of your team members?': communication_modes,
    'Indicate your official social media account (if available)': social_media_link,
    'Indicate the name of focal person/team leader with contact details (email and mobile)': focal_person_contact,
    'Indicate the names and email address of the team members joining the mentoring sessions': mentoring_team_members,
    "What is your team's most preferred time for mentoring sessions?": preferred_mentoring_time,
    'Please specify your preferred time if possible.': mentoring_time_note,
    'Please upload your pitch deck or your business one-pager': pitch_deck_url,
  } = formData;

  // Extract email and phone from focal_person_contact
  const focalEmails = extractEmails(focal_person_contact);
  const focalPhones = extractPhoneNumbers(focal_person_contact);
  const focal_email = focalEmails[0] || null;
  const focal_phone = focalPhones[0] || null;

  try {
    await pgDatabase.query(
      `INSERT INTO mentees_form_submissions (
        timestamp,
        consent,
        team_name,
        se_abbreviation,
        enterprise_idea_start,
        involved_people,
        current_phase,
        social_problem,
        se_nature,
        se_description,
        team_characteristics,
        team_challenges,
        critical_areas,
        action_plans,
        meeting_frequency,
        communication_modes,
        social_media_link,
        focal_person_contact,      
        mentoring_team_members,
        preferred_mentoring_time,
        mentoring_time_note,
        pitch_deck_url,
        focal_email,               
        focal_phone                
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24
      )`,
      [
        new Date(Timestamp),
        consent?.toLowerCase() === "yes",
        team_name,
        se_abbreviation,
        enterprise_idea_start,
        involved_people,
        current_phase,
        social_problem?.split(',').map((v) => v.trim()) || [],
        se_nature,
        se_description,
        team_characteristics,
        team_challenges?.split(',').map((v) => v.trim()) || [],
        critical_areas?.split(',').map((v) => v.trim()) || [],
        action_plans,
        meeting_frequency,
        communication_modes?.split(',').map((v) => v.trim()) || [],
        social_media_link,
        focal_person_contact,
        mentoring_team_members,
        preferred_mentoring_time?.split(',').map((v) => v.trim()) || [],
        mentoring_time_note,
        pitch_deck_url,
        focal_email,
        focal_phone
      ]
    );

    // Fetch LSEED-Directors from DB
    const lseedDirectors = await getLSEEDDirectors(); // change your function if needed

    if (lseedDirectors && lseedDirectors.length > 0) {
      const notificationTitle = `New Social Enterprise Application`;
      const notificationMessage =
        `A new social enterprise (${team_name}) has submitted an application. Review their details in the mentors page.`;

      for (const director of lseedDirectors) {
        const receiverId = director.user_id;

        await pgDatabase.query(
          `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
          VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/socialenterprise');`,
          [receiverId, notificationTitle, notificationMessage]
        );
      }
    }

    if (focal_email) {

      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: `"LSEED Center" <${process.env.EMAIL_USER}>`,
        to: focal_email,
        subject: 'Thank you for your application to the LSEED Program',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000;">
            <p>Dear ${team_name} Team,</p>

            <p>
              Thank you for submitting your application to the <strong>LSEED Center</strong> 
              to be part of our social enterprise development program. We greatly appreciate your 
              interest in creating meaningful change and addressing important social challenges.
            </p>

            <p>
              Our team will carefully review your submission, including your enterprise idea, team 
              details, and mentoring preferences. You will be notified of your application status 
              through this email address. Please ensure you regularly check your inbox (and spam folder) 
              for updates.
            </p>

            <p>
              Should your application be successful, you will receive further instructions regarding 
              onboarding, mentorship coordination, and registration to Telegram.
            </p>

            <p>
              If you have any questions or wish to update any details, feel free to contact us at this address.
            </p>

            <p>
              Warm regards,<br/>
              The LSEED Team
            </p>
          </div>
        `,
      });

      res.sendStatus(200);
    } else {
      console.log(`⚠️ No focal_email provided for ${team_name}. Skipping email.`);
    }

  } catch (error) {
    console.error("❌ Insert error:", error);
    res.sendStatus(500);
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
        SELECT tg.chatid, m.mentor_firstname, m.mentor_lastname, m.mentor_id, s.team_name
        FROM telegrambot AS tg
        JOIN mentors AS m ON m.mentor_id = tg.mentor_id
        JOIN mentorships AS ms ON ms.mentor_id = m.mentor_id
        JOIN socialenterprises AS s ON s.se_id = ms.se_id
        WHERE ms.mentorship_id = $1;
    `;

    const chatResult = await pgDatabase.query(chatQuery, [mentorship_id]);

    if (chatResult.rows.length > 0) {
      console.log(`📩 Sending Mentorship Message to ${chatResult.rows.length} Chat IDs`);

      // ✅ We just need the first row to get mentor_id and team_name
      const { mentor_id, team_name } = chatResult.rows[0];

      for (const row of chatResult.rows) {
        const chatId = row.chatid;

        console.log(`📤 Sending Mentorship Message to Chat ID: ${chatId}`);

        await sendMentorshipMessage(
          chatId,
          mentoring_session_id,
          mentorship_id,
          mentorship_date,
          mentorship_time,
          zoom_link,
          row.mentor_firstname,
          row.mentor_lastname
        );
      }

      // ✅ After all messages sent, insert ONE notification for the mentor
      const notificationTitle = 'Your mentoring session has been approved';
      const notificationMessage = `Your pending mentoring session has been sent to ${team_name} for schedule confirmation`;

      await pgDatabase.query(
        `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/scheduling');`,
        [mentor_id, notificationTitle, notificationMessage]
      );

      console.log(`✅ Single notification inserted for mentor ID: ${mentor_id}`);
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

    const mentorResult = await getMentorsByMentoringSessionID(mentoring_session_id);

    if (mentorResult.length === 0) {
      throw new Error('No mentor found for this mentoring_session_id');
    }

    const notificationTitle = 'Your mentoring session has been declined'
    const notificationMessage =
      `Your requested mentoring session has been declined by the Social Enterprise. Please review the schedule and propose a new date if needed.`;

    await pgDatabase.query(
      `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
      VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/scheduling');`,
      [mentorResult[0].mentor_id, notificationTitle, notificationMessage]
    );

    res.json({ message: "Mentorship declined", mentorship: rows[0] });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/updateMentorshipDate", async (req, res) => {
  console.log("🔹 Received request at /updateMentorshipDate");

  const {
    mentorship_id,
    mentoring_session_date,
    start_time,
    end_time,
    zoom_link,
  } = req.body;

  if (!mentorship_id || !mentoring_session_date || !start_time || !end_time) {
    return res.status(400).json({
      error: "Mentorship ID, date, start time, and end time are required",
    });
  }

  try {
    // 1. Insert mentoring session
    const insertSessionQuery = `
      INSERT INTO mentoring_session (
        start_time, end_time, zoom_link, mentoring_session_date, mentorship_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING mentoring_session_id;
    `;

    const sessionResult = await pgDatabase.query(insertSessionQuery, [
      start_time,
      end_time,
      zoom_link,
      mentoring_session_date,
      mentorship_id,
    ]);

    const newSession = sessionResult.rows[0];

    const mentorQuery = `
      SELECT m.mentor_id, m.mentor_firstname, m.mentor_lastname
      FROM mentorships AS ms
      JOIN mentors AS m ON m.mentor_id = ms.mentor_id
      WHERE ms.mentorship_id = $1;
    `;
    const mentorResult = await pgDatabase.query(mentorQuery, [mentorship_id]);

    let mentorName = "A mentor";
    if (mentorResult.rows.length > 0) {
      const { mentor_firstname, mentor_lastname } = mentorResult.rows[0];
      mentorName = `${mentor_firstname} ${mentor_lastname}`;
    }

    const lseedUsers = await getProgramCoordinatorsByMentorshipID(mentorship_id);
    const lseedDirectors = await getLSEEDDirectors();

    // Notify Directors
    if (lseedDirectors && lseedDirectors.length > 0) {
      const directorTitle = "Mentoring Session Needs Approval";
      const notificationDirectorMessage =
        `${mentorName} has booked a new mentoring session. Please review and approve the session in the dashboard or scheduling matrix page.`;

      for (const director of lseedDirectors) {
        const receiverId = director.user_id;

        await pgDatabase.query(
          `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
          VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/scheduling');`,
          [receiverId, directorTitle, notificationDirectorMessage]
        );
      }
    }

    // Notify Program Coordinators
    if (lseedUsers && lseedUsers.length > 0) {
      const coordinatorTitle = "Mentoring Session Needs Approval";
      const notificationCoordinatorMessage =
        `${mentorName} has booked a new mentoring session. Please review the schedule in the dashboard or scheduling matrix page.`;

      for (const user of lseedUsers) {
        const receiverId = user.user_id;

        await pgDatabase.query(
          `INSERT INTO notification (notification_id, receiver_id, title, message, created_at, target_route) 
          VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), '/scheduling');`,
          [receiverId, coordinatorTitle, notificationCoordinatorMessage]
        );
      }
    }

    console.log(`✅ Mentorship ${mentorship_id} scheduled. Notifications sent.`);
    res.json({ message: "Mentorship date updated", mentorship: newSession });
  } catch (error) {
    console.error("❌ Error in /updateMentorshipDate:", error);
    res.status(500).json({ error: error.message });
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

app.post("/suggested-mentors", async (req, res) => {
  try {
    const { se_id } = req.body;

    if (!se_id) {
      return res.status(400).json({ message: "SE ID is required" });
    }

    const suggestedMentors = await getSuggestedMentors(se_id)

    res.status(200).json(suggestedMentors);
  } catch (error) {
    console.error("❌ Error fetching suggested mentors:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
  // Destructure updatedUser. 'roles' is now expected to be an array of role_names.
  const { first_name, last_name, roles, isactive, email } = updatedUser;

  // Start a transaction to ensure atomicity of user and role updates
  const client = await pgDatabase.connect(); // Get a client from the pool
  try {
    await client.query('BEGIN'); // Start the transaction

    // 1. Update basic user details in the 'users' table
    // IMPORTANT: Remove 'roles = $3' from this UPDATE query, as roles are no longer
    // stored directly in the users table.
    const userUpdateQuery = `
            UPDATE users
            SET
                first_name = $1,
                last_name = $2,
                isactive = $3,
                email = $4
            WHERE user_id = $5
            RETURNING user_id, first_name, last_name, isactive, email;
        `;
    const userUpdateValues = [first_name, last_name, isactive, email, id];
    const userResult = await client.query(userUpdateQuery, userUpdateValues);

    // If the user_id somehow didn't match (e.g., user not found), throw an error
    if (userResult.rows.length === 0) {
      throw new Error(`User with ID ${id} not found for update.`);
    }

    // 2. Handle roles in the 'user_has_roles' table
    // A. Delete all existing role assignments for this user
    await client.query('DELETE FROM user_has_roles WHERE user_id = $1;', [id]);

    // B. Insert new roles if 'roles' array is provided and not empty
    if (roles && Array.isArray(roles) && roles.length > 0) {
      // Prepare values for bulk insert using UNNEST
      // We need an array of user_ids and an array of role_names
      const userIdsForRoles = [];
      const roleNamesForRoles = [];
      roles.forEach(roleName => {
        userIdsForRoles.push(id);
        roleNamesForRoles.push(roleName);
      });

      const roleInsertQuery = `
                INSERT INTO user_has_roles (user_id, role_name)
                SELECT unnest($1::uuid[]), unnest($2::varchar[])
                ON CONFLICT (user_id, role_name) DO NOTHING; -- Prevents errors if a role somehow already exists (though DELETE should prevent this)
            `;
      await client.query(roleInsertQuery, [userIdsForRoles, roleNamesForRoles]);
    }

    await client.query('COMMIT'); // Commit the transaction if all operations succeed

    // Fetch the updated roles to return a complete user object
    // This query is similar to what you'd use for fetching roles on login
    const updatedRolesResult = await client.query(
      `
            SELECT ARRAY_AGG(uhr.role_name) AS roles
            FROM user_has_roles uhr
            WHERE uhr.user_id = $1
            GROUP BY uhr.user_id;
            `,
      [id]
    );

    // Handle the case where ARRAY_AGG returns [null] for users with no roles
    const fetchedRoles = updatedRolesResult.rows[0]?.roles;
    const finalRoles = (fetchedRoles && fetchedRoles.length > 0 && fetchedRoles[0] !== null)
      ? fetchedRoles
      : [];

    // Return the combined updated user data
    // This object should mirror what you store in the session or send to frontend
    return {
      ...userResult.rows[0], // Basic updated user info (id, first_name, last_name, isactive, email)
      roles: finalRoles // The freshly fetched and formatted array of roles
    };

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction on any error
    console.error("Database update error (updateUser function):", error);
    throw error; // Re-throw the error to be caught by the calling API route
  } finally {
    client.release(); // Release the client back to the pool
  }
}

// Endpoint to fetch notifications
app.get("/api/notifications", async (req, res) => {
  try {
    const { receiver_id } = req.query;

    if (!receiver_id) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    // ✅ Fetch the user's roles (as an array) to determine which notifications to show
    const userRolesQuery = `
      SELECT
          ARRAY_AGG(uhr.role_name) AS roles
      FROM
          users u
      LEFT JOIN
          user_has_roles uhr ON u.user_id = uhr.user_id
      WHERE
          u.user_id = $1
      GROUP BY
          u.user_id; -- Group by user_id to get all roles for one user
    `;
    const userResult = await pgDatabase.query(userRolesQuery, [receiver_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract roles array, handling [null] if no roles are assigned
    const userRoles = userResult.rows[0].roles && userResult.rows[0].roles[0] !== null


      ? userResult.rows[0].roles
      : [];

    // Determine the user's effective role for notification purposes
    const isLSEEDUser = userRoles.some(role =>
      role === "LSEED-Coordinator" ||
      role === "LSEED-Director" ||
      role === "Administrator"
    );
    const isMentorUser = userRoles.includes("Mentor");

    let query;
    let queryParams = [receiver_id]; // Base parameters for the query

    // ✅ Modify the query based on user role(s)
    if (isLSEEDUser) {
      // LSEED users (including Administrators) get scheduling notifications
      query = `
          SELECT n.notification_id, n.title, n.created_at,
       COALESCE(u.first_name || ' ' || u.last_name, 'System') AS sender_name,
       n.se_id, se.team_name AS se_name, ms.status, n.target_route, n.message, n.is_read
FROM notification n
LEFT JOIN users u ON n.sender_id = u.user_id
LEFT JOIN socialenterprises se ON n.se_id = se.se_id
LEFT JOIN mentoring_session ms ON n.mentoring_session_id = ms.mentoring_session_id
WHERE n.receiver_id = $1
ORDER BY n.created_at DESC;

      `;
    } else if (isMentorUser) { // If not LSEED, check if they are a Mentor
      // Mentors only get status change notifications
      query = `
          SELECT n.notification_id, n.title, n.created_at,
                  n.se_id, se.team_name AS se_name, ms.status, n.target_route, n.message, n.is_read
          FROM notification n
          LEFT JOIN socialenterprises se ON n.se_id = se.se_id
          LEFT JOIN mentoring_session ms ON n.mentoring_session_id = ms.mentoring_session_id
          WHERE n.receiver_id = $1
          ORDER BY n.created_at DESC;
      `;
    } else {
      // Handle cases for other roles or users with no relevant roles
      // Perhaps return an empty array or a message indicating no specific notifications
      return res.status(200).json([]);
    }

    const result = await pgDatabase.query(query, queryParams); // Use queryParams for the SQL values
    // console.log("📤 Running notification query for:", isLSEEDUser ? "LSEED" : isMentorUser ? "Mentor" : "None");
    // console.log("🧵 Final SQL:", query);
    // console.log("📩 Notifications fetched:", result.rows.length);

    if (result.rows.length === 0) {
      return res.status(200).json([]); // Return empty array if no notifications
    }

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// NEED PA BA ITO?
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


// For Analytics Page

app.get("/api/financial-statements", async (req, res) => {
  try {
    const result = await pgDatabase.query(`
      SELECT fs.report_id, fs.date, fs.total_revenue, fs.total_expenses, fs.net_income,
             fs.total_assets, fs.total_liabilities, fs.owner_equity, fs.se_id,
             se.abbr AS se_abbr
      FROM financial_statements fs
      JOIN socialenterprises se ON fs.se_id = se.se_id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching financial statements:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE?
// // ==========================
// // 📌 API: Check Pending Meetings (Telegram Notification)
// // ==========================
// app.get("/checkPendingMeetings", async (req, res) => {
//   try {
//     console.log("🔍 Running checkPendingMeetings API...");

//     const query = `
//       SELECT m.mentorship_id, m.se_id, m.mentorship_date, t.chatid
//       FROM mentorships m
//       JOIN telegrambot t ON m.se_id = t.se_id
//       WHERE m.telegramstatus = 'Pending'
//     `;

//     const result = await pgDatabase.query(query);
//     console.log("📄 Query Result:", result.rows);

//     if (result.rows.length === 0) {
//       console.log("❌ No pending mentorships found.");
//       return res.json({ message: "No pending mentorship requests." });
//     }

//     for (const row of result.rows) {
//       const { mentorship_id, se_id, mentorship_date, chatid } = row;

//       if (!chatid) {
//         console.warn(`⚠️ No Telegram chat ID found for SE ID ${se_id}`);
//         continue;
//       }

//       console.log(`📩 Sending message to Chat ID: ${chatid} for mentorship ${mentorship_id}`);
//       sendMentorshipMessage(chatid, mentorship_id, mentorship_date);
//     }

//     res.json({ success: true, message: "Mentorship messages sent." });

//   } catch (error) {
//     console.error("❌ ERROR in /checkPendingMeetings:", error.stack);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// ✅ THEN serve React static files
app.use(express.static(path.join(__dirname, 'client/build')));

// ✅ Finally, handle client-side routing fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start the server
const PORT = process.env.BACKEND_PORT;

// Function to set the webhook for a specific bot
async function setWebhook(botToken, webhookPath, ngrokUrl) {
  const webhookUrl = `${ngrokUrl}${webhookPath}`;

  try {
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      url: webhookUrl,
    });

    if (response.data.ok) {
      console.log(`✅ Webhook successfully set for ${botToken} to: ${webhookUrl}`);
    } else {
      console.log(`❌ Failed to set webhook for ${botToken}:`, response.data);
    }
  } catch (error) {
    console.error(`❌ Error setting webhook for ${botToken}:`, error.response?.data || error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  try {
    if (process.env.NODE_ENV === "production") {
      const baseUrl = process.env.WEBHOOK_BASE_URL;
      if (!baseUrl) {
        throw new Error("WEBHOOK_BASE_URL is not set in environment variables.");
      }

      console.log(`🌍 Using webhook base URL: ${baseUrl}`);

      // Set the webhook
      await setWebhook(TELEGRAM_BOT_TOKEN, '/webhook-bot1', baseUrl);
    } else {
      //const ngrokUrl = await ngrok.connect(PORT);
      const ngrokUrl = process.env.NGROK_DOMAIN;
      console.log(`🌍 Ngrok tunnel running at: ${ngrokUrl}`);

      // Set webhooks for both bots
      await setWebhook(TELEGRAM_BOT_TOKEN, '/webhook-bot1', ngrokUrl);
    }
  } catch (error) {
    console.error(`❌ Error setting webhook: ${error.message}`);
  }
});