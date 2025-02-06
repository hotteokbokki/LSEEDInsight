const bcrypt = require("bcryptjs");
const pgDatabase = require("../database.js"); // Import PostgreSQL client

// Login route
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query the Users table for the user based on username
    const query = "SELECT * FROM users WHERE username = $1";
    const values = [username];
    
    const result = await pgDatabase.query(query, values);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set the session
    req.session.user = { id: user.user_id, username: user.username, role: user.roles };
    res.json({ message: "Login successful", user: { id: user.user_id, username: user.username, role: user.roles } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Logout route
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid"); // Clear session cookie
    res.json({ message: "Logout successful" });
  });
};

// Protected route
exports.protectedRoute = (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  res.json({ message: `Welcome ${req.session.user.username}` });
};
