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

    // ✅ Store user details in the session
    req.session.user = {
      id: user.user_id,
      email: user.email,
      role: user.roles,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    // Return success message
    res.json({ message: 'Login successful', user: { email: user.email, role: user.roles } });
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
router.post('/logout', (req, res) => {
    // Clear the session cookie
    res.clearCookie('session_id');
  
    // Return success message
    res.json({ message: 'Logout successful' });
});

module.exports = {
  router,
  requireAuth,
};