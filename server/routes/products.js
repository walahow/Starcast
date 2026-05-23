const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/**
 * GET /api/products
 * List all products with their images. Supports ?status= filter.
 */
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT p.*,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', pi.id, 'image_url', pi.image_url, 'sort_order', pi.sort_order)
        ) FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order) AS images
      FROM products p
    `;
    const params = [];

    if (status) {
      query += " WHERE p.status = ?";
      params.push(status);
    }

    query += " ORDER BY p.created_at DESC";

    const [products] = await pool.query(query, params);

    // Parse images JSON and format response
    const formatted = products.map((p) => {
      const imageUrl = p.image_url ? (typeof p.image_url === "string" ? p.image_url : String(p.image_url)) : null;
      const normalizedImageUrl = imageUrl?.startsWith("/uploads/") ? `/api${imageUrl}` : imageUrl;

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        image_url: normalizedImageUrl,
        scale: p.scale,
        price: parseFloat(p.price),
        status: p.status,
        slot_po: p.slot_po,
        slot_filled: p.slot_filled,
        eta_po: p.eta_po,
        order_description: p.order_description,
        created_at: p.created_at,
        images: p.images ? (typeof p.images === "string" ? JSON.parse(p.images) : p.images) : [],
      };
    });

    res.json({ products: formatted });
  } catch (err) {
    console.error("List products error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/products/:id
 * Get single product with images and reviews.
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = products[0];

    // Get images
    const [images] = await pool.query(
      "SELECT id, image_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order",
      [id]
    );

    // Get reviews with user names
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    const productImageUrl = product.image_url ? (typeof product.image_url === "string" ? product.image_url : String(product.image_url)) : null;
    const normalizedProductImageUrl = productImageUrl?.startsWith("/uploads/") ? `/api${productImageUrl}` : productImageUrl;

    res.json({
      product: {
        ...product,
        image_url: normalizedProductImageUrl,
        price: parseFloat(product.price),
        images,
        reviews,
      },
    });
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
