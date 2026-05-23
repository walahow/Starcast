const express = require("express");
const crypto = require("crypto");
const pool = require("../config/db");
const midtransClient = require("midtrans-client");

// Initialize Midtrans Core API client for status checks
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const router = express.Router();

/**
 * POST /api/payments/webhook
 * Midtrans notification webhook handler.
 *
 * Midtrans sends a POST with JSON body containing:
 * - order_id, transaction_status, fraud_status, status_code,
 *   gross_amount, signature_key, transaction_id, payment_type, etc.
 *
 * Signature verification:
 *   SHA512(order_id + status_code + gross_amount + serverKey)
 */
router.post("/webhook", async (req, res) => {
  try {
    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
      transaction_id,
      payment_type,
    } = req.body;

    console.log(`📨 Midtrans webhook: order=${order_id}, status=${transaction_status}`);

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error("❌ Invalid Midtrans signature");
      return res.status(403).json({ error: "Invalid signature" });
    }

    // Find order by order_code
    const [orders] = await pool.query("SELECT id FROM orders WHERE order_code = ?", [order_id]);
    if (orders.length === 0) {
      console.error(`❌ Order not found: ${order_id}`);
      return res.status(404).json({ error: "Order not found" });
    }

    const dbOrderId = orders[0].id;

    // Determine payment status based on Midtrans transaction_status
    let paymentStatus = "pending";
    let orderStatus = "pending";

    if (transaction_status === "capture") {
      // For credit card: check fraud_status
      if (fraud_status === "accept") {
        paymentStatus = "success";
        orderStatus = "paid";
      } else if (fraud_status === "challenge") {
        paymentStatus = "pending";
        orderStatus = "pending";
      } else {
        paymentStatus = "failed";
        orderStatus = "cancelled";
      }
    } else if (transaction_status === "settlement") {
      paymentStatus = "success";
      orderStatus = "paid";
    } else if (transaction_status === "pending") {
      paymentStatus = "pending";
      orderStatus = "pending";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "failure"
    ) {
      paymentStatus = "failed";
      orderStatus = "cancelled";
    } else if (transaction_status === "expire") {
      paymentStatus = "expired";
      orderStatus = "cancelled";
    } else if (transaction_status === "refund" || transaction_status === "partial_refund") {
      paymentStatus = "failed";
      orderStatus = "cancelled";
    }

    // Update payment record
    await pool.query(
      `UPDATE payments SET
        payment_status = ?,
        transaction_id = ?,
        paid_at = IF(? = 'success', NOW(), paid_at)
       WHERE order_id = ?`,
      [paymentStatus, transaction_id || null, paymentStatus, dbOrderId]
    );

    // Update order status
    await pool.query("UPDATE orders SET order_status = ? WHERE id = ?", [orderStatus, dbOrderId]);

    // If payment failed/cancelled/expired, restore product slots
    if (orderStatus === "cancelled") {
      const [orderItems] = await pool.query(
        "SELECT product_id, qty FROM order_items WHERE order_id = ?",
        [dbOrderId]
      );
      for (const item of orderItems) {
        await pool.query(
          "UPDATE products SET slot_filled = GREATEST(0, slot_filled - ?) WHERE id = ?",
          [item.qty, item.product_id]
        );
      }
      console.log(`🔄 Slots restored for cancelled order ${order_id}`);
    }

    console.log(`✅ Payment ${paymentStatus} for order ${order_id}`);

    // Midtrans expects HTTP 200 response
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    // Still return 200 to prevent Midtrans retries on server errors
    res.status(200).json({ status: "error", message: err.message });
  }
});

/**
 * GET /api/payments/status/:orderCode
 * Check payment status for a given order (for frontend polling).
 */
router.get("/status/:orderCode", async (req, res) => {
  try {
    const { orderCode } = req.params;

    const [results] = await pool.query(
      `SELECT o.id as order_id, o.order_code, o.order_status, o.total,
              p.id as payment_id, p.payment_status, p.transaction_id, p.paid_at
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.order_code = ?`,
      [orderCode]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderRow = results[0];
    let paymentData = {
      order_code: orderRow.order_code,
      order_status: orderRow.order_status,
      total: parseFloat(orderRow.total),
      payment_status: orderRow.payment_status || "pending",
      transaction_id: orderRow.transaction_id || null,
      paid_at: orderRow.paid_at || null,
    };

    const shouldRefresh = !orderRow.payment_status || orderRow.payment_status === "pending";
    if (shouldRefresh) {
      try {
        // Ask Midtrans for latest transaction status
        const statusResponse = await coreApi.transaction.status(orderCode);
        const transaction_status = statusResponse.transaction_status;
        const fraud_status = statusResponse.fraud_status;
        const transaction_id = statusResponse.transaction_id || null;

        let paymentStatus = "pending";
        let orderStatus = "pending";

        if (transaction_status === "capture") {
          if (fraud_status === "accept") {
            paymentStatus = "success";
            orderStatus = "paid";
          } else if (fraud_status === "challenge") {
            paymentStatus = "pending";
            orderStatus = "pending";
          } else {
            paymentStatus = "failed";
            orderStatus = "cancelled";
          }
        } else if (transaction_status === "settlement") {
          paymentStatus = "success";
          orderStatus = "paid";
        } else if (transaction_status === "pending") {
          paymentStatus = "pending";
          orderStatus = "pending";
        } else if (
          transaction_status === "deny" ||
          transaction_status === "cancel" ||
          transaction_status === "failure" ||
          transaction_status === "expire"
        ) {
          paymentStatus = "failed";
          orderStatus = "cancelled";
        }

        if (orderRow.payment_id) {
          await pool.query(
            `UPDATE payments SET payment_status = ?, transaction_id = ?, paid_at = IF(? = 'success', NOW(), paid_at) WHERE id = ?`,
            [paymentStatus, transaction_id, paymentStatus, orderRow.payment_id]
          );
        } else {
          await pool.query(
            `INSERT INTO payments (order_id, gateway, payment_status, transaction_id, amount, paid_at)
             VALUES (?, 'midtrans', ?, ?, ?, IF(? = 'success', NOW(), NULL))`,
            [orderRow.order_id, paymentStatus, transaction_id, orderRow.total, paymentStatus]
          );
        }

        await pool.query("UPDATE orders SET order_status = ? WHERE order_code = ?", [orderStatus, orderCode]);

        paymentData = {
          ...paymentData,
          order_status: orderStatus,
          payment_status: paymentStatus,
          transaction_id,
          paid_at: paymentStatus === "success" ? new Date() : paymentData.paid_at,
        };
      } catch (refreshError) {
        console.error("Failed to refresh payment status from Midtrans:", refreshError);
      }
    }

    res.json({ payment: paymentData });
  } catch (err) {
    console.error("Payment status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
