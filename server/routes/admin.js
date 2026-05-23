const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../public/uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9\.\-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-\.]+|[-\.]+$/g, "");
    const timestamp = Date.now();
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG images are allowed."));
    }
    cb(null, true);
  },
});

const router = express.Router();

// Helper: ensure a column exists on a table
async function ensureColumn(table, column, definition) {
  try {
    const [cols] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    if (cols && cols[0] && cols[0].cnt === 0) {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`✅ Added column ${table}.${column}`);
    }
  } catch (err) {
    console.error(`Error ensuring column ${table}.${column}:`, err.message);
    throw err;
  }
}

// Helper: ensure notifications table exists in current database
async function ensureNotificationsTable() {
  const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'`);
  if (rows && rows[0] && rows[0].cnt === 0) {
    await pool.query(`
      CREATE TABLE notifications (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id INT UNSIGNED NOT NULL,
        order_id INT UNSIGNED DEFAULT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data JSON DEFAULT NULL,
        sent TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (id),
        KEY idx_notifications_user (user_id),
        KEY idx_notifications_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✅ Created notifications table");
  }
}

// Helper: ensure bulk shipping jobs table exists
async function ensureBulkJobsTable() {
  const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bulk_shipping_jobs'`);
  if (rows && rows[0] && rows[0].cnt === 0) {
    await pool.query(`
      CREATE TABLE bulk_shipping_jobs (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        items JSON NOT NULL,
        total INT NOT NULL DEFAULT 0,
        processed INT NOT NULL DEFAULT 0,
        status ENUM('pending','processing','done','failed') NOT NULL DEFAULT 'pending',
        result JSON DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        PRIMARY KEY(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created bulk_shipping_jobs table');
  }
}

// Process job in background (non-blocking)
async function processBulkShippingJob(jobId) {
  try {
    const [jobs] = await pool.query('SELECT * FROM bulk_shipping_jobs WHERE id = ?', [jobId]);
    if (!jobs.length) return;
    const job = jobs[0];
    const items = JSON.parse(job.items || '[]');

    await pool.query("UPDATE bulk_shipping_jobs SET status = 'processing', processed = 0 WHERE id = ?", [jobId]);

    const results = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      try {
        const orderCode = String(it.order_code || '').trim();
        if (!orderCode) {
          results.push({ order_code: orderCode, ok: false, error: 'missing_order_code' });
          continue;
        }
        const [orders] = await pool.query('SELECT id, user_id FROM orders WHERE order_code = ?', [orderCode]);
        if (!orders.length) {
          results.push({ order_code: orderCode, ok: false, error: 'order_not_found' });
          continue;
        }
        const order = orders[0];
        const tracking_number = it.tracking_number || null;
        const tracking_url = it.tracking_url || null;
        const courier = it.courier || null;
        const ship_status = it.ship_status || 'shipped';

        const [u] = await pool.query(
          `UPDATE shipping SET tracking_number = ?, tracking_url = COALESCE(?, tracking_url), courier = COALESCE(?, courier), ship_status = ?, shipped_at = IF(? = 'shipped', NOW(), shipped_at) WHERE order_id = ?`,
          [tracking_number, tracking_url, courier, ship_status, ship_status, order.id]
        );

        if (u.affectedRows === 0) {
          results.push({ order_code: orderCode, ok: false, error: 'shipping_row_missing' });
        } else {
          const title = `Update Pengiriman: ${orderCode}`;
          const body = `Nomor resi: ${tracking_number || '-'}\nKurir: ${courier || '-'}\nLihat: ${tracking_url || '-'}`;
          await pool.query(`INSERT INTO notifications (user_id, order_id, type, title, body, data, sent) VALUES (?, ?, 'shipping_update', ?, ?, ?, 0)`, [order.user_id, order.id, title, body, JSON.stringify({ tracking_number, tracking_url, courier })]);
          results.push({ order_code: orderCode, ok: true });
        }

      } catch (err) {
        console.error('Bulk item error', err);
        results.push({ order_code: it.order_code || '', ok: false, error: 'internal_error' });
      }

      // update progress
      await pool.query('UPDATE bulk_shipping_jobs SET processed = ? WHERE id = ?', [i + 1, jobId]);
    }

    await pool.query('UPDATE bulk_shipping_jobs SET status = ?, result = ? WHERE id = ?', ['done', JSON.stringify(results), jobId]);
  } catch (err) {
    console.error('Process bulk job failed', err);
    await pool.query("UPDATE bulk_shipping_jobs SET status = 'failed', result = ? WHERE id = ?", [JSON.stringify({ error: err.message }), jobId]);
  }
}

/**
 * Middleware to check if user is admin
 */
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ===========================
// DASHBOARD & STATISTICS
// ===========================

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get("/dashboard", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'paid') as paid_orders,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'processing') as processing_orders,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT SUM(total) FROM orders WHERE order_status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE DATE(ordered_at) = CURDATE()) as today_orders
    `);

    const dashboardData = stats[0] || {};

    res.json({
      total_orders: dashboardData.total_orders || 0,
      paid_orders: dashboardData.paid_orders || 0,
      processing_orders: dashboardData.processing_orders || 0,
      total_customers: dashboardData.total_customers || 0,
      total_products: dashboardData.total_products || 0,
      total_revenue: parseFloat(dashboardData.total_revenue) || 0,
      today_orders: dashboardData.today_orders || 0,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===========================
// PRODUCT MANAGEMENT
// ===========================

/**
 * GET /api/admin/products
 * List all products for admin
 */
router.get("/products", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', pi.id, 'image_url', pi.image_url, 'sort_order', pi.sort_order)
        ) FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order) AS images
      FROM products p
      ORDER BY p.created_at DESC
    `);

    const formatted = products.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      slot_po: p.slot_po,
      slot_filled: p.slot_filled,
      images: p.images ? (typeof p.images === "string" ? JSON.parse(p.images) : p.images) : [],
    }));

    res.json({ products: formatted });
  } catch (err) {
    console.error("List admin products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/admin/products
 * Create a new product
 */
router.post("/products", authMiddleware, adminOnly, upload.single("image"), async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { title, description, image_url, scale, price, status, slot_po, eta_po, order_description } = req.body;
    const imageUrl = req.file ? `/api/uploads/${req.file.filename}` : image_url || null;
    const normalizedImageUrl = imageUrl?.startsWith("/uploads/") ? `/api${imageUrl}` : imageUrl || null;

    if (!title || !price) {
      return res.status(400).json({ error: "Title and price are required" });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO products (title, description, image_url, scale, price, status, slot_po, slot_filled, eta_po, order_description) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)",
      [title, description || null, normalizedImageUrl, scale || null, parseFloat(price), status || "ready", slot_po || null, eta_po || null, order_description || null]
    );

    await conn.commit();

    const [newProduct] = await pool.query("SELECT * FROM products WHERE id = ?", [result.insertId]);

    res.status(201).json({
      message: "Product created successfully",
      product: { ...newProduct[0], price: parseFloat(newProduct[0].price), images: [] },
    });
  } catch (err) {
    await conn.rollback();
    console.error("Create product error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.release();
  }
});

/**
 * PUT /api/admin/products/:id
 * Update a product
 */
router.put("/products/:id", authMiddleware, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url, scale, price, status, slot_po, eta_po, order_description } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: "Title and price are required" });
    }

    const [existingRows] = await pool.query("SELECT image_url FROM products WHERE id = ?", [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const imageUrl = req.file ? `/api/uploads/${req.file.filename}` : image_url || existingRows[0].image_url || null;
    const finalImageUrl = imageUrl?.startsWith("/uploads/") ? `/api${imageUrl}` : imageUrl || null;

    const [result] = await pool.query(
      "UPDATE products SET title = ?, description = ?, image_url = ?, scale = ?, price = ?, status = ?, slot_po = ?, eta_po = ?, order_description = ? WHERE id = ?",
      [title, description || null, finalImageUrl, scale || null, parseFloat(price), status || "ready", slot_po || null, eta_po || null, order_description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [updated] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);

    res.json({
      message: "Product updated successfully",
      product: { ...updated[0], price: parseFloat(updated[0].price) },
    });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete a product
 */
router.delete("/products/:id", authMiddleware, adminOnly, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { id } = req.params;

    await conn.beginTransaction();

    // Delete product images
    await conn.query("DELETE FROM product_images WHERE product_id = ?", [id]);

    // Delete product
    const [result] = await conn.query("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    await conn.commit();

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.release();
  }
});

/**
 * PUT /api/admin/products/:id/po-status
 * Update PO status and duration
 */
router.put("/products/:id/po-status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, slot_po, eta_po } = req.body;

    if (!status || !["ready", "PO", "PO_closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateData = { status };
    if (status === "PO" && slot_po) {
      updateData.slot_po = parseInt(slot_po);
    }
    if (eta_po) {
      updateData.eta_po = eta_po;
    }

    const [result] = await pool.query(
      "UPDATE products SET status = ?, slot_po = ?, eta_po = ? WHERE id = ?",
      [status, slot_po || null, eta_po || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [updated] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);

    res.json({
      message: "Product PO status updated",
      product: updated[0],
    });
  } catch (err) {
    console.error("Update PO status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===========================
// ORDER MANAGEMENT
// ===========================

/**
 * GET /api/admin/orders
 * List all orders with filtering
 */
router.get("/orders", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, sort = "newest" } = req.query;

    let query = `
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
        JSON_ARRAYAGG(
          JSON_OBJECT('product_id', oi.product_id, 'qty', oi.qty, 'price', oi.price_snapshot, 'title', oi.product_title_snapshot)
        ) as order_items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;

    const params = [];

    if (status) {
      query += " WHERE o.order_status = ?";
      params.push(status);
    }

    query += " GROUP BY o.id";

    if (sort === "oldest") {
      query += " ORDER BY o.ordered_at ASC";
    } else {
      query += " ORDER BY o.ordered_at DESC";
    }

    const [orders] = await pool.query(query, params);

    const formatted = orders.map((o) => {
      const parsedItems = o.order_items
        ? typeof o.order_items === "string"
          ? JSON.parse(o.order_items)
          : o.order_items
        : [];

      return {
        ...o,
        subtotal: parseFloat(o.subtotal),
        shipping_cost: parseFloat(o.shipping_cost),
        total: parseFloat(o.total),
        order_items: Array.isArray(parsedItems) ? parsedItems : [],
      };
    });

    res.json({ orders: formatted });
  } catch (err) {
    console.error("List admin orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/admin/orders/bulk-shipping
 * Accepts JSON array of { order_code, tracking_number, courier, tracking_url }
 * Returns summary of updates and errors.
 */
router.post("/orders/bulk-shipping", authMiddleware, adminOnly, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const items = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array required" });
    }

    await ensureColumn("shipping", "tracking_url", "VARCHAR(500) DEFAULT NULL");
    await ensureNotificationsTable();

    await conn.beginTransaction();
    const results = [];
    for (const it of items) {
      const orderCode = String(it.order_code || "").trim();
      if (!orderCode) {
        results.push({ order_code: orderCode, ok: false, error: "missing_order_code" });
        continue;
      }

      const [orders] = await conn.query("SELECT id, user_id FROM orders WHERE order_code = ?", [orderCode]);
      if (!orders.length) {
        results.push({ order_code: orderCode, ok: false, error: "order_not_found" });
        continue;
      }
      const order = orders[0];

      const tracking_number = it.tracking_number || null;
      const tracking_url = it.tracking_url || null;
      const courier = it.courier || null;
      const ship_status = it.ship_status || "shipped";

      const [u] = await conn.query(
        `UPDATE shipping SET tracking_number = ?, tracking_url = COALESCE(?, tracking_url), courier = COALESCE(?, courier), ship_status = ?, shipped_at = IF(? = 'shipped', NOW(), shipped_at) WHERE order_id = ?`,
        [tracking_number, tracking_url, courier, ship_status, ship_status, order.id]
      );

      if (u.affectedRows === 0) {
        results.push({ order_code: orderCode, ok: false, error: "shipping_row_missing" });
        continue;
      }

      // insert notification record
      const title = `Update Pengiriman: ${orderCode}`;
      const body = `Nomor resi: ${tracking_number || "-"}\nKurir: ${courier || "-"}\nLihat: ${tracking_url || "-"}`;
      await conn.query(`INSERT INTO notifications (user_id, order_id, type, title, body, data, sent) VALUES (?, ?, 'shipping_update', ?, ?, ?, 0)`, [order.user_id, order.id, title, body, JSON.stringify({ tracking_number, tracking_url, courier })]);

      results.push({ order_code: orderCode, ok: true });
    }

    await conn.commit();
    res.json({ results });
  } catch (err) {
    await conn.rollback();
    console.error("Bulk shipping error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.release();
  }
});

/**
 * POST /api/admin/orders/bulk-shipping-job
 * Create a job (async) to process many tracking updates.
 */
router.post('/orders/bulk-shipping-job', authMiddleware, adminOnly, async (req, res) => {
  try {
    const items = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array required' });
    }

    await ensureBulkJobsTable();

    const [r] = await pool.query('INSERT INTO bulk_shipping_jobs (items, total, processed, status) VALUES (?, ?, 0, "pending")', [JSON.stringify(items), items.length]);
    const jobId = r.insertId;

    // Start processing asynchronously, don't block response
    setImmediate(() => processBulkShippingJob(jobId));

    res.status(202).json({ jobId });
  } catch (err) {
    console.error('Create bulk job error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders/bulk-shipping-job/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, total, processed, status, result, created_at, updated_at FROM bulk_shipping_jobs WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Job not found' });
    res.json({ job: rows[0] });
  } catch (err) {
    console.error('Get bulk job error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/orders/:id
 * Get order details
 */
router.get("/orders/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, u.address as customer_address
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];

    // Get order items
    const [items] = await pool.query(
      `SELECT oi.*, p.title as current_title, p.status as product_status
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    // Get payment
    const [payments] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [id]);

    // Get shipping
    const [shippings] = await pool.query("SELECT * FROM shipping WHERE order_id = ?", [id]);

    res.json({
      order: {
        ...order,
        subtotal: parseFloat(order.subtotal),
        shipping_cost: parseFloat(order.shipping_cost),
        total: parseFloat(order.total),
        items: items.map((i) => ({ ...i, price_snapshot: parseFloat(i.price_snapshot) })),
        payment: payments[0] || null,
        shipping: shippings[0] || null,
      },
    });
  } catch (err) {
    console.error("Get admin order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put("/orders/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    if (!order_status || !["pending", "paid", "processing", "shipped", "done", "cancelled"].includes(order_status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [result] = await pool.query("UPDATE orders SET order_status = ? WHERE id = ?", [order_status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const [updated] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);

    res.json({
      message: "Order status updated",
      order: { ...updated[0], subtotal: parseFloat(updated[0].subtotal), total: parseFloat(updated[0].total) },
    });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/admin/orders/:id/shipping
 * Update shipping tracking and delivery status
 */
router.put("/orders/:id/shipping", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { tracking_number, tracking_url, ship_status, courier, service, shipped_at, delivered_at, notify } = req.body;

    // Validate basic ship_status (keep compatibility)
    const allowed = ["not_shipped", "shipped", "delivered"];
    if (!ship_status || !allowed.includes(ship_status)) {
      return res.status(400).json({ error: "Invalid ship_status" });
    }

    // Ensure columns exist - MUST be done before UPDATE
    try {
      await ensureColumn("shipping", "tracking_url", "VARCHAR(500) DEFAULT NULL");
    } catch (colErr) {
      // Column may already exist, continue anyway
    }
    
    try {
      await ensureNotificationsTable();
    } catch (notifErr) {
      // Table may already exist, continue anyway
    }

    // Ensure the order exists before updating or creating shipping details
    const [orderRows] = await pool.query("SELECT id FROM orders WHERE id = ?", [id]);
    if (!orderRows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Insert or update shipping row in one query so missing rows do not fail.
    await pool.query(
      `INSERT INTO shipping (order_id, courier, service, cost, tracking_number, tracking_url, ship_status, shipped_at, delivered_at)
       VALUES (?, ?, ?, 0.00, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         courier = VALUES(courier),
         service = VALUES(service),
         tracking_number = VALUES(tracking_number),
         tracking_url = VALUES(tracking_url),
         ship_status = VALUES(ship_status),
         shipped_at = VALUES(shipped_at),
         delivered_at = VALUES(delivered_at)`,
      [id, courier || null, service || null, tracking_number || null, tracking_url || null, ship_status, shipped_at || null, delivered_at || null]
    );

    // Update order_status when appropriate
    if (ship_status === "shipped") {
      await pool.query("UPDATE orders SET order_status = 'shipped' WHERE id = ?", [id]);
    } else if (ship_status === "delivered") {
      await pool.query("UPDATE orders SET order_status = 'done' WHERE id = ?", [id]);
    }

    const [updated] = await pool.query("SELECT * FROM shipping WHERE order_id = ?", [id]);

    // Notify customer: insert into notifications table and log/send stub
    if (notify) {
      // Retrieve user id and email for this order
      const [ordRows] = await pool.query("SELECT user_id, order_code FROM orders WHERE id = ?", [id]);
      if (ordRows.length) {
        const orderRow = ordRows[0];
        const [userRows] = await pool.query("SELECT id, email, name FROM users WHERE id = ?", [orderRow.user_id]);
        const user = userRows[0];
        const title = `Update Pengiriman: ${orderRow.order_code}`;
        const body = `Nomor resi: ${tracking_number || "-"}\nKurir: ${courier || "-"}\nLihat: ${tracking_url || "-"}`;

        await pool.query(
          `INSERT INTO notifications (user_id, order_id, type, title, body, data, sent) VALUES (?, ?, 'shipping_update', ?, ?, ?, 0)`,
          [orderRow.user_id, id, title, body, JSON.stringify({ tracking_number, tracking_url, courier, service })]
        );

        // Simple email/send stub (no SMTP setup): log to console
        console.log(`✉️ Notify user ${user?.email} — ${title}\n${body}`);
      }
    }

    res.json({ message: "Shipping updated", shipping: updated[0] });
  } catch (err) {
    console.error("Update shipping error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===========================
// CUSTOMER MANAGEMENT
// ===========================

/**
 * GET /api/admin/customers
 * List all customers
 */
router.get("/customers", authMiddleware, adminOnly, async (req, res) => {
  try {
    const [customers] = await pool.query(
      `SELECT u.*, COUNT(o.id) as total_orders, COALESCE(SUM(o.total), 0) as total_spent
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id AND o.order_status = 'paid'
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    const formatted = customers.map((c) => ({
      ...c,
      total_orders: parseInt(c.total_orders) || 0,
      total_spent: parseFloat(c.total_spent) || 0,
    }));

    res.json({ customers: formatted });
  } catch (err) {
    console.error("List customers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/admin/customers/:id
 * Get customer details
 */
router.get("/customers/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'customer'", [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = users[0];

    // Get customer orders
    const [orders] = await pool.query(
      `SELECT id, order_code, order_status, total, ordered_at FROM orders WHERE user_id = ? ORDER BY ordered_at DESC`,
      [id]
    );

    res.json({
      customer: {
        ...customer,
        orders: orders.map((o) => ({ ...o, total: parseFloat(o.total) })),
      },
    });
  } catch (err) {
    console.error("Get customer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===========================
// INVENTORY MANAGEMENT
// ===========================

/**
 * PUT /api/admin/products/:id/stock
 * Update product stock status
 */
router.put("/products/:id/stock", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, slot_po } = req.body;

    if (status === "PO" && (!slot_po || slot_po <= 0)) {
      return res.status(400).json({ error: "slot_po is required for PO status" });
    }

    const [result] = await pool.query("UPDATE products SET status = ?, slot_po = ? WHERE id = ?", [status, status === "PO" ? slot_po : null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [updated] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);

    res.json({
      message: "Stock updated",
      product: updated[0],
    });
  } catch (err) {
    console.error("Update stock error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
