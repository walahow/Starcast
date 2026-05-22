export type ProductStatus = "Open PO" | "Coming Soon" | "Sold Out" | "Ready Stock";

export interface Product {
  id: number;
  name: string;
  brand: string;
  scale: string;
  price: string;
  image: string;
  status: ProductStatus;
  slots_total: number;
  slots_filled: number;
  po_deadline: string;
  eta: string;
  note: string;
  whatsapp_msg: string;
}

export const SITE_CONFIG = {
  instagram_url: "https://www.instagram.com/starcast.id/",
  whatsapp_number: "",
};

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "RWB 930 STELLA ARTOIS",
    brand: "Almost Real",
    scale: "1:64",
    price: "Rp 375.000",
    image: "/images/1/product.jpg",
    status: "Open PO",
    slots_total: 12,
    slots_filled: 0,
    po_deadline: "2026-04-21",
    eta: "Q2-Q3",
    note: "Warna Black Chrome adalah Chase Car nya",
    whatsapp_msg: "Halo Admin Starcast, saya ingin PO Almost Real RWB 930 Stella Artois",
  },
  {
    id: 2,
    name: "Nissan SILVIA S15 'AXIS' 33 blue and white",
    brand: "Sup Car",
    scale: "1:64",
    price: "Rp 390.000",
    image: "/images/2/product.jpg",
    status: "Open PO",
    slots_total: 12,
    slots_filled: 0,
    po_deadline: "2026-04-22",
    eta: "Q2-Q3",
    note: "",
    whatsapp_msg: "Halo Admin Starcast, saya ingin PO Sup Car Nissan SILVIA S15 'AXIS' 33",
  },
  {
    id: 3,
    name: "MINI GT (Bugatti / Shelby / RX-7 / McLaren)",
    brand: "MINI GT",
    scale: "1:64",
    price: "Rp 213.000 - Rp 274.000",
    image: "/images/3/product.jpg",
    status: "Open PO",
    slots_total: 24,
    slots_filled: 0,
    po_deadline: "2026-04-22",
    eta: "Q3",
    note: "Ketik book kode + jumlah (misal: book A1)",
    whatsapp_msg: "Halo Admin Starcast, saya ingin PO MINI GT (Ketik Kode A/B/C/D)",
  },
  {
    id: 4,
    name: "Porsche 911 GT1 LM 1998",
    brand: "Trends Hobby",
    scale: "1:64",
    price: "Rp 249.999",
    image: "/images/4/product.jpg",
    status: "Open PO",
    slots_total: 12,
    slots_filled: 0,
    po_deadline: "2026-04-06",
    eta: "Q3",
    note: "Kesempatan terakhir (Last Chance)",
    whatsapp_msg: "Halo Admin Starcast, saya ingin PO Trends Hobby Porsche 911 GT1 LM 1998",
  },
  {
    id: 5,
    name: "LBWK Countach - Comba Grey (Licensed)",
    brand: "Top Art",
    scale: "1:64",
    price: "Rp 915.000",
    image: "/images/5/product.jpg",
    status: "Ready Stock",
    slots_total: 3,
    slots_filled: 0,
    po_deadline: "",
    eta: "Ready",
    note: "Stok sisa PO sangat terbatas",
    whatsapp_msg: "Halo Admin Starcast, saya ingin beli Ready Stock Top Art LBWK Countach - Comba Grey",
  },
  {
    id: 6,
    name: "RWB 964 Light Brown Synthetic",
    brand: "Time Micro",
    scale: "1:64",
    price: "Rp 365.000",
    image: "/images/6/product.jpg",
    status: "Open PO",
    slots_total: 12,
    slots_filled: 0,
    po_deadline: "2026-04-16",
    eta: "Q2-Q3",
    note: "Free ongkir (maks 20k)",
    whatsapp_msg: "Halo Admin Starcast, saya ingin PO Time Micro RWB 964 Light Brown Synthetic",
  },
  {
    id: 7,
    name: "Impreza \"Raider\" of the gray stripe",
    brand: "Time Micro × PSC DESIGN",
    scale: "1:64",
    price: "Rp 365.000",
    image: "/images/7/product.jpg",
    status: "Open PO",
    slots_total: 12,
    slots_filled: 0,
    po_deadline: "",
    eta: "Q3",
    note: "Batch 2",
    whatsapp_msg: "Halo Admin Starcast, saya ingin PO Time Micro × PSC DESIGN Impreza Raider",
  },
  {
    id: 8,
    name: "RWB 930 Matte Black - Stella Artois",
    brand: "Pop Race",
    scale: "1:64",
    price: "Rp 210.000",
    image: "/images/8/product.jpg",
    status: "Open PO",
    slots_total: 12,
    slots_filled: 0,
    po_deadline: "2026-04-13",
    eta: "Q3",
    note: "Batch 2",
    whatsapp_msg: "Halo Admin Starcast, saya ingin PO Pop Race RWB 930 Matte Black",
  },
  {
    id: 9,
    name: "EVO 9 LANCER EVOLUTION Silver",
    brand: "Time Micro",
    scale: "1:64",
    price: "Rp 335.000",
    image: "/images/9/product.jpg",
    status: "Open PO",
    slots_total: 12,
    slots_filled: 0,
    po_deadline: "2026-04-14",
    eta: "Q3",
    note: "Free ongkir (maks 20k)",
    whatsapp_msg: "Halo Admin Starcast, saya ingin PO Time Micro EVO 9 Lancer Evolution",
  },
];
