const express = require("express");
const bcrypt = require('bcrypt'); // For password hashing
const session = require("express-session");
const cookieParser = require('cookie-parser');
const { login, logout, protectedRoute } = require("../controllers/authController");
const pgDatabase = require("../database.js"); // Import PostgreSQL client

const router = express.Router();

router.post("/", login);
router.get("/logout", logout);
router.get("/protected", protectedRoute);

// const sessionId = crypto.randomUUID();

const requireAuth = (req, res, next) => {
  // console.log("🔹 Checking authentication...");
  // console.log("🔹 Session Data:", req.session); // Log the session object
  // console.log("🔹 Cookies:", req.cookies); // Log received cookies
  // console.log("🔹 Headers:", req.headers); // Log headers to check for missing JWT

  if (!req.session || !req.session.user) {
    console.log("🚨 Unauthorized: No session found.");
    return res.status(401).json({ error: "Unauthorized: No session found." });
  }

  console.log("[authRoutes]✅ User is authenticated:", req.session.user);
  // Add additional validation, like checking the session ID in a database or store if needed.
  next();
};

router.use(cookieParser()); // Middleware to parse cookies

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query to fetch user data from PostgreSQL
    const result = await pgDatabase.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0]; // Assuming email is unique, we take the first result

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isactive) {
      return res.status(403).json({ message: 'Your account is pending verification. Please wait for LSEED to verify your account.' });
    }

    // ✅ Generate a unique session ID
    const sessionId = crypto.randomUUID();

    try {
      console.log('[authRoutes] Inserting session into active_sessions');
      // ✅ Insert the session ID into `active_sessions`
      const sessionInsertQuery = `
        INSERT INTO active_sessions (session_id, user_id) VALUES ($1, $2)
      `;
      await pgDatabase.query(sessionInsertQuery, [sessionId, user.user_id]);
      
    } catch (error) {
      console.error('Error inserting session:', error);
    }
    console.log("[authRoutes] Session ID (global):", sessionId);

    // ✅ Store user details in the session
    req.session.user = {
      id: user.user_id,
      email: user.email,
      role: user.roles,
      firstName: user.first_name,
      lastName: user.last_name,
      sessionId: sessionId,
    };

    console.log("[authRoutes] Session after login:", req.session.user.sessionId); // Add this log

    // ✅ Set session ID in a cookie
    res.cookie("session_id", sessionId, { httpOnly: true, secure: false });

    // Separate handling for admin and normal users
    if (user.roles === "Administrator") {
      return res.json({
        message: "Admin login successful",
        user: { id: user.user_id, email: user.email, role: user.roles },
        session_id: sessionId,
        redirect: "/admin",
      });
    } else {
      return res.json({
        message: "User login successful",
        user: { id: user.user_id, email: user.email, role: user.roles, firstname: user.first_name, lastname: user.last_name },
        session_id: sessionId,
        redirect: "/dashboard", // Normal users go to their dashboard
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get("/session-check", (req, res) => {
  console.log("🔍 [routes] Checking session...");
  console.log("🔹 [routes] Cookies Received:", req.cookies); // Log cookies
  console.log("🔹 [routes] Session Data:", req.session); // Log session data

  if (req.session && req.session.user) {
    return res.json({ sessionUser: req.session.user.id });
  } else {
    return res.status(401).json({ message: "No active session" });
  }
});



router.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching users" });
  }
});

router.get("/mentors", async (req, res) => {
  try {
    const result = await pgDatabase.query(`SELECT mentor_id, mentor_firstname || ' ' || mentor_lastname AS name, calendarlink FROM mentors`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database Error:", err);  // Improved logging
    res.status(500).json({ error: "Error fetching mentors" });
  }
});

module.exports = {
  router,
  requireAuth,
};