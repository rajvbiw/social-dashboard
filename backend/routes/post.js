const express = require("express");
const router = express.Router();
const Queue = require("bull");
const { query } = require("../db");

// Redis Queue
const postQueue = new Queue("post-scheduling", process.env.REDIS_URL);

// ✅ Create / Schedule Post
router.post("/schedule", async (req, res) => {
  try {
    const { content, scheduledAt } = req.body;

    if (!content || !scheduledAt) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Save as scheduled
    await query(
      "INSERT INTO posts (content, scheduled_at, status) VALUES ($1, $2, $3)",
      [content, scheduledAt, "scheduled"]
    );

    // Add job to queue
    await postQueue.add({ content, scheduledAt });

    res.json({ message: "Post scheduled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to schedule post" });
  }
});

// ✅ Get all posts
router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM posts ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

module.exports = router;