const express = require("express");
const bcrypt = require('bcrypt'); // For password hashing
const session = require("express-session");
const cookieParser = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');
const { login, logout, protectedRoute } = require("../controllers/authController");

const router = express.Router();

router.post("/", login);
router.get("/logout", logout);
router.get("/protected", protectedRoute);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
      // Fetch user data from Supabase
      const { data, error } = await supabase
        .from('Users')  // Assuming your table is named 'Users'
        .select('*')  // Select the necessary fields
        .eq('email', email)
        .single();  // Expecting a single user (email should be unique)
  
      if (error || !data) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (error) {
          console.error('Supabase Error:', error);
          return res.status(500).json({ message: 'Database error' });
      }

      if (!data || !data.password) {
          return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, data.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // ✅ Store user details in the session
      req.session.user = {
        id: data.user_id,
        email: data.email,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
      };
  
      // Return success message
      res.json({ message: 'Login successful', user: { email: data.email, role:data.role } });
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

    // Assign "Guest User" as the default role
    const role = "Guest User";

    // Insert the new user into the Users table
    const { data, error } = await supabase
      .from("Users")
      .insert([
        { firstName, lastName, email, password: hashedPassword, role },
      ]);

    if (error) {
      console.error("Error inserting user:", error);
      return res.status(500).json({ message: "Failed to register user" });
    }

    res.status(201).json({ message: "User registered successfully", user: data });
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