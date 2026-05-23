const express = require("express");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const midtransClient = require("midtrans-client");

const router = express.Router();

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * Generate unique order code: SC-YYYYMMDD-XXXXX
 */
function generateOrderCode() {
  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
  // Include timestamp tail to guarantee uniqueness even on rapid retries
  const timePart = (now % 100000).toString(36).toUpperCase().padStart(4, "0");
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SC-${date}-${timePart}${rand}`;
}

async function applyAutoCompleteDeliveredOrders(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const now = Date.now();
  for (const row of rows) {
    if (row.order_status !== "done" && row.ship_status === "delivered" && row.delivered_at) {
      const deliveredAt = new Date(row.delivered_at).getTime();
      if (!Number.isNaN(deliveredAt) && now >= deliveredAt + 3 * 24 * 60 * 60 * 1000) {
        await pool.query("UPDATE orders SET order_status = 'done' WHERE id = ?", [row.id]);
        row.order_status = "done";
      }
    }
  }
}

/**
 * POST /api/orders
 * Create a new order and generate Midtrans snap token.
 *
 * Body: {
 *   items: [{ product_id, qty }],
 *   shipping_address: string,
 *   courier: string (optional),
 *   shipping_cost: number (optional, from distance calc)
 * }
 */
router.post("/", authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { items, shipping_address, courier, shipping_cost } = req.body;
    const shippingAddress = String(shipping_address || "").trim();
    const courierValue = String(courier || "JNE").trim() || "JNE";
    const shippingCost = Number(shipping_cost) || 0;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }
    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    const cleanItems = items.map((item) => ({
      product_id: Number(item.product_id),
      qty: Number(item.qty),
    }));

    if (cleanItems.some((item) => !item.product_id || item.qty <= 0)) {
      return res.status(400).json({ error: "Cart items are invalid" });
    }

    await conn.beginTransaction();

    // Detect whether `stock` column exists (some installs may have physical stock)
    const [colInfo] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'stock'",
      [process.env.DB_NAME || conn.config.database]
    );
    const hasStock = (colInfo && colInfo[0] && colInfo[0].cnt > 0) || false;

    // Fetch actual prices and inventory columns from DB to prevent price tampering
    const productIds = cleanItems.map((i) => i.product_id);
    const selectFields = `id, title, price, status, slot_po, slot_filled${hasStock ? ', stock' : ''}`;
    const [products] = await conn.query(
      `SELECT ${selectFields} FROM products WHERE id IN (?)`,
      [productIds]
    );

    // Build product lookup
    const productMap = {};
    for (const p of products) {
      productMap[p.id] = p;
    }

    // Validate each item
    let subtotal = 0;
    const orderItems = [];
    const midtransItems = [];

    for (const item of cleanItems) {
      const product = productMap[item.product_id];
      if (!product) {
        await conn.rollback();
        return res.status(400).json({ error: `Product ID ${item.product_id} not found` });
      }

      // Check stock/slot availability
      if (product.status === "PO_closed") {
        await conn.rollback();
        return res.status(400).json({ error: `PO for "${product.title}" is closed` });
      }

      // If product uses physical `stock` and is ready, validate stock
      if (hasStock && product.status === "ready") {
        const available = typeof product.stock === 'number' ? product.stock : 0;
        if (available < item.qty) {
          await conn.rollback();
          return res.status(400).json({ error: `Not enough stock for "${product.title}". Available: ${available}` });
        }
      }

      // For PO items validate slot capacity
      const slotPo = Number(product.slot_po) || 0;
      if (product.status === "PO") {
        if (!slotPo) {
          await conn.rollback();
          return res.status(400).json({ error: `Slot capacity for "${product.title}" is not available` });
        }
        if (product.slot_filled + item.qty > slotPo) {
          await conn.rollback();
          return res.status(400).json({
            error: `Not enough slots for "${product.title}". Available: ${slotPo - product.slot_filled}`,
          });
        }
      }

      const price = parseFloat(product.price);
      const qty = parseInt(item.qty) || 1;
      const lineTotal = price * qty;
      subtotal += lineTotal;

      orderItems.push({
        product_id: product.id,
        qty,
        price_snapshot: price,
        product_title_snapshot: product.title,
      });

      midtransItems.push({
        id: `PROD-${product.id}`,
        price: Math.round(price),
        quantity: qty,
        name: product.title.substring(0, 50),
      });
    }

    const total = subtotal + shippingCost;
    const orderCode = generateOrderCode();

    // Insert order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, order_code, order_status, subtotal, shipping_cost, total, shipping_address, courier)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [req.user.id, orderCode, subtotal, shippingCost, total, shippingAddress, courierValue]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const oi of orderItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, qty, price_snapshot, product_title_snapshot)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, oi.product_id, oi.qty, oi.price_snapshot, oi.product_title_snapshot]
      );
    }

    // Update inventory: decrement `stock` for ready products if present, otherwise increment slot_filled for PO
    for (const item of cleanItems) {
      const prod = productMap[item.product_id];
      const qty = item.qty;
      if (hasStock && prod.status === 'ready') {
        const [u] = await conn.query(
          "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
          [qty, item.product_id, qty]
        );
        if (u.affectedRows === 0) {
          await conn.rollback();
          return res.status(400).json({ error: `Not enough stock for "${prod.title}"` });
        }
      } else {
        await conn.query("UPDATE products SET slot_filled = slot_filled + ? WHERE id = ?", [qty, item.product_id]);
      }
    }

    // Add shipping as Midtrans line item if applicable
    if (shippingCost > 0) {
      midtransItems.push({
        id: "SHIPPING",
        price: Math.round(shippingCost),
        quantity: 1,
        name: `Ongkir ${courierValue}`,
      });
    }

    // Create Midtrans Snap transaction
    const [users] = await conn.query("SELECT name, email, phone FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const user = users[0];

    const midtransParam = {
      transaction_details: {
        order_id: orderCode,
        gross_amount: Math.round(total),
      },
      item_details: midtransItems,
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.phone || "",
        shipping_address: {
          address: shippingAddress,
        },
      },
    };

    const snapResponse = await snap.createTransaction(midtransParam);

    // Insert payment record
    await conn.query(
      `INSERT INTO payments (order_id, gateway, payment_status, amount)
       VALUES (?, 'midtrans', 'pending', ?)`,
      [orderId, total]
    );

    // Insert shipping record
    await conn.query(
      `INSERT INTO shipping (order_id, courier, cost)
       VALUES (?, ?, ?)`,
      [orderId, courierValue, shippingCost]
    );

    await conn.commit();

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: orderId,
        order_code: orderCode,
        total,
        subtotal,
        shipping_cost: shippingCost,
      },
      snap_token: snapResponse.token,
      snap_redirect_url: snapResponse.redirect_url,
    });
  } catch (err) {
    await conn.rollback();
    // Log full error detail for debugging
    console.error("[orders] Create order error:", {
      message: err.message,
      midtransApiResponse: err.ApiResponse || null,
      httpStatusCode: err.httpStatusCode || null,
      stack: err.stack?.split("\n").slice(0, 5),
    });
    const clientMsg = err.ApiResponse?.error_messages?.[0]
      || err.message
      || "Gagal membuat pesanan. Silakan coba lagi.";
    res.status(500).json({ error: clientMsg });
  } finally {
    conn.release();
  }
});

/**
 * GET /api/orders
 * List orders for authenticated user.
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, p.payment_status, p.transaction_id, p.gateway, p.paid_at,
        s.courier, s.service, s.cost AS shipping_cost, s.tracking_number, s.tracking_url, s.ship_status, s.shipped_at, s.delivered_at,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'qty', oi.qty,
            'price', oi.price_snapshot,
            'title', oi.product_title_snapshot,
            'product_status', prod.status,
            'eta_po', prod.eta_po
          )
        ) FROM order_items oi
          JOIN products prod ON prod.id = oi.product_id
          WHERE oi.order_id = o.id) AS items
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       LEFT JOIN shipping s ON s.order_id = o.id
       WHERE o.user_id = ?
       ORDER BY o.ordered_at DESC`,
      [req.user.id]
    );

    await applyAutoCompleteDeliveredOrders(orders);

    const formatted = orders.map((o) => {
      const parsedItems = o.items
        ? typeof o.items === "string"
          ? JSON.parse(o.items)
          : o.items
        : [];

      const poItems = Array.isArray(parsedItems)
        ? parsedItems.filter((item) => item.product_status === "PO")
        : [];
      const poEtaDates = poItems
        .map((item) => item.eta_po)
        .filter((date) => !!date)
        .sort();

      return {
        ...o,
        subtotal: parseFloat(o.subtotal),
        shipping_cost: parseFloat(o.shipping_cost || 0),
        total: parseFloat(o.total),
        shipping: {
          courier: o.courier || null,
          service: o.service || null,
          cost: parseFloat(o.shipping_cost || 0),
          tracking_number: o.tracking_number || null,
          tracking_url: o.tracking_url || null,
          ship_status: o.ship_status || "not_shipped",
          shipped_at: o.shipped_at || null,
          delivered_at: o.delivered_at || null,
        },
        items: Array.isArray(parsedItems) ? parsedItems : [],
        has_po: poItems.length > 0,
        po_eta: poEtaDates.length ? poEtaDates[poEtaDates.length - 1] : null,
      };
    });

    res.json({ orders: formatted });
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query(
      `SELECT o.*, p.payment_status, p.transaction_id, p.gateway, p.paid_at,
        s.courier, s.service, s.cost AS shipping_cost, s.tracking_number, s.tracking_url, s.ship_status, s.shipped_at, s.delivered_at
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       LEFT JOIN shipping s ON s.order_id = o.id
       WHERE o.user_id = ? AND o.id = ?`,
      [req.user.id, id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];
    await applyAutoCompleteDeliveredOrders([order]);

    const [items] = await pool.query(
      `SELECT oi.product_id,
              oi.qty,
              oi.price_snapshot AS price,
              oi.product_title_snapshot AS title,
              prod.status AS product_status,
              prod.eta_po
       FROM order_items oi
       LEFT JOIN products prod ON prod.id = oi.product_id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    const poItems = items.filter((item) => item.product_status === "PO");
    const poEtaDates = poItems.map((item) => item.eta_po).filter((date) => !!date).sort();

    res.json({
      order: {
        ...order,
        subtotal: parseFloat(order.subtotal),
        shipping_cost: parseFloat(order.shipping_cost || 0),
        total: parseFloat(order.total),
        shipping: {
          courier: order.courier || null,
          service: order.service || null,
          cost: parseFloat(order.shipping_cost || 0),
          tracking_number: order.tracking_number || null,
          ship_status: order.ship_status || "not_shipped",
          shipped_at: order.shipped_at || null,
          delivered_at: order.delivered_at || null,
        },
        items: items.map((item) => ({
          ...item,
          price: parseFloat(item.price),
        })),
        has_po: poItems.length > 0,
        po_eta: poEtaDates.length ? poEtaDates[poEtaDates.length - 1] : null,
      },
    });
  } catch (err) {
    console.error("Get order detail error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/pay", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch order
    const [orders] = await pool.query(
      `SELECT id, order_code, order_status, total, shipping_address, shipping_cost, courier FROM orders WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];

    if (order.order_status !== "pending") {
      return res.status(400).json({ error: "Only pending orders can be paid." });
    }

    // 2. Fetch order items
    const [items] = await pool.query(
      `SELECT product_id, qty, price_snapshot, product_title_snapshot FROM order_items WHERE order_id = ?`,
      [order.id]
    );

    // 3. Construct Midtrans transaction parameters
    const midtransItems = items.map((it) => ({
      id: `PROD-${it.product_id}`,
      price: Math.round(parseFloat(it.price_snapshot)),
      quantity: it.qty,
      name: it.product_title_snapshot.substring(0, 50),
    }));

    if (parseFloat(order.shipping_cost) > 0) {
      midtransItems.push({
        id: "SHIPPING",
        price: Math.round(parseFloat(order.shipping_cost)),
        quantity: 1,
        name: `Ongkir ${order.courier || "JNE"}`,
      });
    }

    // 4. Fetch user details
    const [users] = await pool.query("SELECT name, email, phone FROM users WHERE id = ?", [req.user.id]);
    const user = users[0];

    const midtransParam = {
      transaction_details: {
        order_id: order.order_code,
        gross_amount: Math.round(parseFloat(order.total)),
      },
      item_details: midtransItems,
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.phone || "",
        shipping_address: {
          address: order.shipping_address,
        },
      },
    };

    // 5. Create Midtrans snap transaction
    const snapResponse = await snap.createTransaction(midtransParam);

    res.json({
      snap_token: snapResponse.token,
      snap_redirect_url: snapResponse.redirect_url,
    });
  } catch (err) {
    console.error("[orders] Pay order error:", err);
    const clientMsg = err.ApiResponse?.error_messages?.[0]
      || err.message
      || "Gagal memproses pembayaran. Silakan coba lagi.";
    res.status(500).json({ error: clientMsg });
  }
});

router.put("/:id/confirm", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query(
      `SELECT o.id, o.order_status, s.ship_status, s.delivered_at
       FROM orders o
       LEFT JOIN shipping s ON s.order_id = o.id
       WHERE o.user_id = ? AND o.id = ?`,
      [req.user.id, id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];
    if (order.order_status === "done") {
      return res.json({ message: "Order already completed" });
    }

    if (order.ship_status !== "delivered") {
      return res.status(400).json({ error: "Order cannot be confirmed until delivery is completed" });
    }

    await pool.query("UPDATE orders SET order_status = 'done' WHERE id = ?", [id]);
    res.json({ message: "Order confirmed complete" });
  } catch (err) {
    console.error("Confirm order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/reviews", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const [reviews] = await pool.query(
      `SELECT r.id, r.product_id, r.rating, r.comment, r.created_at
       FROM reviews r
       WHERE r.order_id = ? AND r.user_id = ?`,
      [id, req.user.id]
    );

    res.json({ reviews });
  } catch (err) {
    console.error("Get order reviews error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/reviews", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, rating, comment } = req.body;

    const [orders] = await pool.query("SELECT order_status FROM orders WHERE id = ? AND user_id = ?", [id, req.user.id]);
    if (!orders.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];
    if (order.order_status !== "done") {
      return res.status(400).json({ error: "Only completed orders can be reviewed" });
    }

    const [items] = await pool.query("SELECT product_id FROM order_items WHERE order_id = ? AND product_id = ?", [id, product_id]);
    if (!items.length) {
      return res.status(400).json({ error: "Product not found in this order" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM reviews WHERE order_id = ? AND user_id = ? AND product_id = ?",
      [id, req.user.id, product_id]
    );
    if (existing.length) {
      return res.status(400).json({ error: "Product already reviewed for this order" });
    }

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const [result] = await pool.query(
      `INSERT INTO reviews (user_id, product_id, order_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, product_id, id, parsedRating, comment || null]
    );

    res.status(201).json({ id: result.insertId, product_id, rating: parsedRating, comment: comment || null });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
