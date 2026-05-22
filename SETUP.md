# Starcast v2 - Redesigned Next.js Store

## What's New

This is a complete redesign of your diecast shop with a modern, minimalist aesthetic featuring luxury black & gold branding.

### Design Improvements

✨ **Modern Luxury Aesthetic**
- Black (#0f0f0f) background with gold (#d4af37) accents
- Premium serif font (Cormorant Garamond) for headings
- Clean sans-serif font (Inter) for body text
- Improved spacing, hierarchy, and visual breathing room

📱 **Better UX/UI**
- Responsive design (mobile, tablet, desktop)
- Smooth hover transitions and animations
- Clear visual hierarchy
- Better color contrast for readability

🎨 **Collectors Marketplace Feel**
- Curated product display
- Premium card design with status badges
- Live countdown timers
- Slot tracking with visual progress bars
- Seamless pre-order vs ready stock integration

## Project Structure

```
starcast-showcase-v2/
├── app/
│   ├── admin/              # Admin dashboard routes
│   │   ├── page.tsx        # Dashboard overview
│   │   ├── products/       # Product management CRUD
│   │   └── preorders/      # Pre-order tracking
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles + theme
├── components/             # Reusable components
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Showcase.tsx
│   ├── ProductCard.tsx
│   ├── HowToPreOrder.tsx
│   └── Footer.tsx
├── lib/
│   └── products.ts         # Product data + types
└── public/images/          # Product images
```

## Features

### Home Page (/)
- **Navigation Bar**: Sticky nav with mobile menu
- **Hero Section**: Full-screen hero with product images grid
- **Showcase**: Product grid with:
  - Live countdown timers
  - Slot availability tracking
  - Status badges (Open PO, Ready Stock, Coming Soon, Sold Out)
  - Pre-order vs direct purchase differentiation
  - WhatsApp integration
- **How to Pre-Order**: Step-by-step process
- **Footer**: Links and social media

### Admin Dashboard (/admin)

#### Dashboard Overview
- Key metrics (total products, open POs, ready stock, slots)
- Recent products table
- Quick action buttons

#### Product Management (/admin/products)
- **View**: Table of all products
- **Create**: Add new products
- **Edit**: Modify product details
- **Delete**: Remove products
- Fields: name, brand, price, scale, status, slots, deadlines, notes, images, WhatsApp message

#### Pre-Order Tracking (/admin/preorders)
- View all pre-orders with customer details
- Filter by status (Pending, Confirmed, Paid, Shipped)
- Update pre-order status
- Contact customers via WhatsApp
- Total orders and stats

## Color Scheme

- **Primary**: #d4af37 (Gold)
- **Primary Dark**: #b8941e (Dark Gold)
- **Background**: #0f0f0f (Black)
- **Secondary**: #1a1a1a (Dark Gray)
- **Border**: #2a2a2a
- **Text**: #fafafa (Light)
- **Muted**: #999999

## Getting Started

### Installation

```bash
cd starcast-showcase-v2
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the store.

### Production Build

```bash
npm run build
npm start
```

## Customization

### Adding Products

Edit `lib/products.ts`:
```typescript
{
  id: 10,
  name: "Product Name",
  brand: "Brand Name",
  scale: "1:64",
  price: "Rp XXX.XXX",
  image: "/images/10/product.jpg",
  status: "Open PO",
  slots_total: 12,
  slots_filled: 0,
  po_deadline: "2026-06-01",
  eta: "Q3",
  note: "Optional note",
  whatsapp_msg: "Message template for WhatsApp",
}
```

### Updating Colors

Edit `app/globals.css`:
```css
:root {
  --primary: #d4af37; /* Gold */
  --background: #0f0f0f; /* Black */
  /* ... */
}
```

### Fonts

Currently using Google Fonts:
- **Headings**: Cormorant Garamond (Serif)
- **Body**: Inter (Sans-serif)

Edit `app/globals.css` to change fonts.

## Features to Add Later

- [ ] Shopping cart
- [ ] Checkout system
- [ ] Payment integration
- [ ] Order history
- [ ] User accounts
- [ ] Email notifications
- [ ] Image upload for admin
- [ ] Analytics dashboard
- [ ] Review system

## Technology Stack

- **Framework**: Next.js 16.2.6
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Package Manager**: npm

## Notes

- Admin pages currently use local state (data resets on refresh)
- To persist data, integrate a backend/database
- Images are stored in `public/images/` directory
- WhatsApp integration uses URL encoding (no backend API needed)
- All data is frontend-only for now

## Support

For any issues or customizations, refer to:
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com
- Product Images: `public/images/`
