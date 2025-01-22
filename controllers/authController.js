const bcrypt = require("bcryptjs");
const supabase = require("../supabase");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query the Users table for the user
    const { data: user, error } = await supabase
      .from("Users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set the session
    req.session.user = { id: user.id, username: user.username };
    res.json({ message: "Login successful", user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid"); // Clear session cookie
      res.json({ message: "Logout successful" });
    });
};
  

exports.protectedRoute = (req, res) => {
    if (!req.session.user) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    res.json({ message: `Welcome ${req.session.user.username}` });
};
  