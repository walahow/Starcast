const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const ordersRoutes = require("./routes/orders");
const paymentsRoutes = require("./routes/payments");
const shippingRoutes = require("./routes/shipping");
const adminRoutes = require("./routes/admin");
const reviewsRoutes = require("./routes/reviews");
const instagramRoutes = require("./routes/instagram");

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/instagram", instagramRoutes);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --- Start server ---
async function seedDefaultProducts() {
  try {
    const [rows] = await pool.query("SELECT id FROM products LIMIT 1");
    if (rows.length === 0) {
      console.log("Seeding default products into MySQL database...");
      
      const defaultProducts = [
        {
          id: 1,
          title: "RWB 930 STELLA ARTOIS",
          description: "Warna Black Chrome adalah Chase Car nya",
          image_url: "/images/1/product.jpg",
          scale: "1:64",
          price: 375000,
          status: "PO",
          slot_po: 12,
          slot_filled: 0,
          eta_po: "2026-04-21",
          order_description: "Almost Real"
        },
        {
          id: 2,
          title: "Nissan SILVIA S15 'AXIS' 33 blue and white",
          description: "",
          image_url: "/images/2/product.jpg",
          scale: "1:64",
          price: 390000,
          status: "PO",
          slot_po: 12,
          slot_filled: 0,
          eta_po: "2026-04-22",
          order_description: "Sup Car"
        },
        {
          id: 3,
          title: "MINI GT (Bugatti / Shelby / RX-7 / McLaren)",
          description: "Ketik book kode + jumlah (misal: book A1)",
          image_url: "/images/3/product.jpg",
          scale: "1:64",
          price: 213000,
          status: "PO",
          slot_po: 24,
          slot_filled: 0,
          eta_po: "2026-04-22",
          order_description: "MINI GT"
        },
        {
          id: 4,
          title: "Porsche 911 GT1 LM 1998",
          description: "Kesempatan terakhir (Last Chance)",
          image_url: "/images/4/product.jpg",
          scale: "1:64",
          price: 249999,
          status: "PO",
          slot_po: 12,
          slot_filled: 0,
          eta_po: "2026-04-06",
          order_description: "Trends Hobby"
        },
        {
          id: 5,
          title: "LBWK Countach - Comba Grey (Licensed)",
          description: "Stok sisa PO sangat terbatas",
          image_url: "/images/5/product.jpg",
          scale: "1:64",
          price: 915000,
          status: "ready",
          slot_po: 3,
          slot_filled: 0,
          eta_po: null,
          order_description: "Top Art"
        },
        {
          id: 6,
          title: "RWB 964 Light Brown Synthetic",
          description: "Free ongkir (maks 20k)",
          image_url: "/images/6/product.jpg",
          scale: "1:64",
          price: 365000,
          status: "PO",
          slot_po: 12,
          slot_filled: 0,
          eta_po: "2026-04-16",
          order_description: "Time Micro"
        },
        {
          id: 7,
          title: "Impreza \"Raider\" of the gray stripe",
          description: "Batch 2",
          image_url: "/images/7/product.jpg",
          scale: "1:64",
          price: 365000,
          status: "PO",
          slot_po: 12,
          slot_filled: 0,
          eta_po: null,
          order_description: "Time Micro × PSC DESIGN"
        },
        {
          id: 8,
          title: "RWB 930 Matte Black - Stella Artois",
          description: "Batch 2",
          image_url: "/images/8/product.jpg",
          scale: "1:64",
          price: 210000,
          status: "PO",
          slot_po: 12,
          slot_filled: 0,
          eta_po: "2026-04-13",
          order_description: "Pop Race"
        },
        {
          id: 9,
          title: "EVO 9 LANCER EVOLUTION Silver",
          description: "Free ongkir (maks 20k)",
          image_url: "/images/9/product.jpg",
          scale: "1:64",
          price: 335000,
          status: "PO",
          slot_po: 12,
          slot_filled: 0,
          eta_po: "2026-04-14",
          order_description: "Time Micro"
        }
      ];

      for (const p of defaultProducts) {
        await pool.query(
          "INSERT INTO products (id, title, description, image_url, scale, price, status, slot_po, slot_filled, eta_po, order_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.title, p.description, p.image_url, p.scale, p.price, p.status, p.slot_po, p.slot_filled, p.eta_po, p.order_description]
        );
        
        // Seed default product images
        await pool.query(
          "INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, 0)",
          [p.id, p.image_url]
        );
      }
      
      console.log("✅ Seeded 9 default products & images successfully.");
    }
  } catch (err) {
    console.error("Failed to seed default products:", err);
  }
}

async function ensureAdminAccount() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@starcast.id";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

    const [rows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const [result] = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
        ["Starcast Admin", adminEmail, hashedPassword]
      );
      console.log(`✅ Default admin created: ${adminEmail}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD ? "(from ADMIN_PASSWORD)" : "Admin123!"}`);
    } else {
      console.log("✅ Admin account already exists, no default admin created.");
    }
  } catch (err) {
    console.error("Failed to ensure admin account:", err);
  }
}

app.listen(PORT, async () => {
  await ensureAdminAccount();
  await seedDefaultProducts();
  console.log(`\n🚀 Starcast API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.MIDTRANS_IS_PRODUCTION === "true" ? "PRODUCTION" : "SANDBOX"}`);
  console.log(`   Database: ${process.env.DB_NAME}\n`);
});
