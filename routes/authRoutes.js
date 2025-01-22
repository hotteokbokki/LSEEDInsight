const express = require("express");
const bcrypt = require('bcrypt'); // For password hashing
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

router.use(cookieParser()); // Middleware to parse cookies

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Fetch user data from Supabase
      const { data, error } = await supabase
        .from('Users')  // Assuming your table is named 'Users'
        .select('id, email, password')  // Select the necessary fields
        .eq('email', email)
        .single();  // Expecting a single user (email should be unique)
  
      if (error || !data) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, data.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Create a session
      // Store the user ID or other session data in a cookie
      res.cookie('session_id', data.id, {
        httpOnly: true,  // Prevents JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        maxAge: 24 * 60 * 60 * 1000,  // 1 day expiration
      });
  
      // Return success message
      res.json({ message: 'Login successful', user: { email: data.email } });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    // Clear the session cookie
    res.clearCookie('session_id');
  
    // Return success message
    res.json({ message: 'Logout successful' });
});

module.exports = router;
