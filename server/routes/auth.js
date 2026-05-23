const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new customer account.
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check duplicate email
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, 'customer')",
      [name, email, hashedPassword, phone || null, address || null]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, email, role: "customer", name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: result.insertId, name, email, role: "customer", phone, address },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires auth).
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: users[0] });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
