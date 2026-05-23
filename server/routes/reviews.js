const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/**
 * GET /api/reviews/recent
 * Return recent product reviews for display in homepage carousel.
 */
router.get("/recent", async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name, p.id AS product_id, p.title AS product_title
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       ORDER BY r.created_at DESC
       LIMIT 12`
    );

    res.json({ reviews });
  } catch (err) {
    console.error("Get recent reviews error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
