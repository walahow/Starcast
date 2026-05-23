const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "8889"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "root",
  database: process.env.DB_NAME || "starcast_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection on startup
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ MySQL connected to", process.env.DB_NAME);
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
  });

module.exports = pool;
