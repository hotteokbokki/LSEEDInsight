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

const sessionId = crypto.randomUUID();

const requireAuth = (req, res, next) => {
  const sessionId = req.cookies.session_id; // Access the session cookie
  if (!sessionId) {
    return res.status(401).json({ message: "Unauthorized: No session ID" });
  }

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

    // ✅ Generate a unique session ID
    // const sessionId = crypto.randomUUID();
    try {
      console.log('Inserting session into active_sessions');
      // ✅ Insert the session ID into `active_sessions`
      const sessionInsertQuery = `
        INSERT INTO active_sessions (session_id, user_id) VALUES ($1, $2)
      `;
      await pgDatabase.query(sessionInsertQuery, [sessionId, user.user_id]);
      
    } catch (error) {
      console.error('Error inserting session:', error);
    }
    

    // ✅ Store user details in the session
    req.session.user = {
      id: user.user_id,
      email: user.email,
      role: user.roles,
      firstName: user.first_name,
      lastName: user.last_name,
      sessionId: sessionId,
    };

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
        user: { id: user.user_id, email: user.email, role: user.roles },
        session_id: sessionId,
        redirect: "/dashboard", // Normal users go to their dashboard
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Assign "Guest User" as the default role if no role is provided
    const userRole = role || "Guest User";

    // Insert the new user into the Users table
    const insertQuery = `
      INSERT INTO users (first_name, last_name, email, password, roles)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [firstName, lastName, email, hashedPassword, userRole];

    const result = await pgDatabase.query(insertQuery, values);
    const newUser = result.rows[0];

    // Check if user is created successfully
    if (!newUser) {
      return res.status(500).json({ message: "Failed to register user" });
    }

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: "An error occurred during signup" });
  }
});

// Logout route
router.post('/logout', async  (req, res) => {
  console.log("logging out - authRoutes");
  try {
    // Retrieve session ID from the cookie
    console.log('Session ID:', sessionId);

    if (sessionId === undefined) {
        return res.status(400).json({ message: 'No session found' });
    }

    // Query to delete the session from active_sessions table
    const deleteSessionQuery = `DELETE FROM active_sessions WHERE session_id = $1`;

    // Execute the query
    await pgDatabase.query(deleteSessionQuery, [sessionId]);
    
    console.log("Session ID Deleted");

    // Clear the session cookie
    res.clearCookie('session_id');
    
    // Return success message
    res.json({ message: 'Logout successful' });
} catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'An error occurred during logout' });
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
    const result = await pool.query("SELECT mentor_id, mentor_firstname || ' ' || mentor_lastname AS name, calendarLink FROM mentors");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error fetching mentors" });
  }
});

router.post("/updateCalendarLink", requireAuth, async (req, res) => {
  const { calendarlink } = req.body;  // We only need calendarlink to update
  const userId = req.session.user.id; // Get the user ID from the session
  console.log("User id @authroutes: ", userId);
  
  try {
    if (userId) {
      // Assuming your mentors table has a column mentor_id to identify the mentor
      const result = await pgDatabase.query(
        `UPDATE mentors
         SET calendarlink = $1
         WHERE mentor_id = $2`,
        [calendarlink, userId]  // Use userId from session
      );

      if (result.rowCount > 0) {
        res.status(200).json({ message: "Calendar link updated successfully!" });
      } else {
        res.status(400).json({ error: "Failed to update calendar link. Mentor not found." });
      }
    } else {
      res.status(400).json({ error: "User ID is required." });
    }
  } catch (error) {
    console.error("Error updating calendar link:", error);
    res.status(500).json({ error: "Server error." });
  }
});



module.exports = {
  router,
  requireAuth,
};