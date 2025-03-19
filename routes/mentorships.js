const express = require("express");
const router = express.Router();
const { getMentorshipsByMentorId } = require("../controllers/mentorshipsController");

// API route: GET mentorships by mentor ID
router.get("/:mentorId", async (req, res) => {
  try {
    const mentorId = req.params.mentorId;
    const mentorships = await getMentorshipsByMentorId(mentorId);
    res.json(mentorships);
  } catch (error) {
    console.error("Error fetching mentorships:", error);
    res.status(500).json({ error: "Failed to fetch mentorships" });
  }
});

module.exports = router;
