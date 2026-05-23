-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 19 Bulan Mei 2026 pada 19.51
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `starcast_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `feedbacks`
--

CREATE TABLE `feedbacks` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `message` text NOT NULL,
  `contact_back` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `order_code` varchar(30) NOT NULL,
  `order_status` enum('pending','paid','processing','shipped','done','cancelled') NOT NULL DEFAULT 'pending',
  `subtotal` decimal(14,2) NOT NULL DEFAULT 0.00,
  `shipping_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(14,2) NOT NULL DEFAULT 0.00,
  `shipping_address` text NOT NULL,
  `courier` varchar(50) DEFAULT NULL,
  `ordered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `qty` smallint(6) NOT NULL DEFAULT 1,
  `price_snapshot` decimal(12,2) NOT NULL DEFAULT 0.00,
  `product_title_snapshot` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `payments`
--

CREATE TABLE `payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `gateway` varchar(50) NOT NULL,
  `payment_status` enum('pending','success','failed','expired') NOT NULL DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `paid_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `scale` varchar(20) DEFAULT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('ready','PO','PO_closed') NOT NULL DEFAULT 'ready',
  `slot_po` int(10) UNSIGNED DEFAULT NULL,
  `slot_filled` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `eta_po` date DEFAULT NULL,
  `order_description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `product_images`
--

CREATE TABLE `product_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `sort_order` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `reviews`
--

CREATE TABLE `reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `shipping`
--

CREATE TABLE `shipping` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `courier` varchar(50) NOT NULL,
  `service` varchar(30) DEFAULT NULL,
  `cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tracking_number` varchar(100) DEFAULT NULL,
  `ship_status` enum('not_shipped','shipped','delivered') NOT NULL DEFAULT 'not_shipped',
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `role` enum('admin','customer') NOT NULL DEFAULT 'customer',
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_feedbacks_user_id` (`user_id`);

--
-- Indeks untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_orders_order_code` (`order_code`),
  ADD KEY `idx_orders_user_id` (`user_id`);

--
-- Indeks untuk tabel `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order_id` (`order_id`),
  ADD KEY `idx_order_items_product_id` (`product_id`);

--
-- Indeks untuk tabel `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payments_order_id` (`order_id`);

--
-- Indeks untuk tabel `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_images_product_id` (`product_id`);

--
-- Indeks untuk tabel `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reviews_user_id` (`user_id`),
  ADD KEY `idx_reviews_product_id` (`product_id`),
  ADD KEY `idx_reviews_order_id` (`order_id`);

--
-- Indeks untuk tabel `shipping`
--
ALTER TABLE `shipping`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_shipping_order_id` (`order_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `feedbacks`
--
ALTER TABLE `feedbacks`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `shipping`
--
ALTER TABLE `shipping`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD CONSTRAINT `fk_feedbacks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `shipping`
--
ALTER TABLE `shipping`
  ADD CONSTRAINT `fk_shipping_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
