const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { router: authRoutes, requireAuth } = require("./routes/authRoutes");
require("dotenv").config();

const app = express();

// Enable CORS with credentials
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Configure session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use a secure key
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Use authentication routes
app.use("/auth", authRoutes);

// Example of a protected route
app.get("/protected", requireAuth, (req, res) => {
  res.json({ message: "Access granted to protected route" });
});

module.exports = app;
