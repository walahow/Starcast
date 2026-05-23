import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("starcast_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("starcast_token");
        localStorage.removeItem("starcast_user");
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Typed API helpers ──

export interface ApiProduct {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  scale: string | null;
  price: number;
  status: "ready" | "PO" | "PO_closed";
  slot_po: number | null;
  slot_filled: number;
  eta_po: string | null;
  order_description: string | null;
  created_at: string;
  images: { id: number; image_url: string; sort_order: number }[];
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
}

export interface ShippingResult {
  distance_km: number;
  estimated_cost: number;
  duration_text: string;
  seller: { lat: number; lng: number };
  buyer: { lat: number; lng: number };
  route_geometry: any | null;
  method: string;
  geo_display: string | null;
  packing_days: number;
  transit_days_min: number;
  transit_days_max: number;
  estimated_arrival_text: string;
}

export const productApi = {
  list: () => api.get<{ products: ApiProduct[] }>("/products").then((r) => r.data.products),
  get: (id: number) => api.get<{ product: ApiProduct }>(`/products/${id}`).then((r) => r.data.product),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: ApiUser }>("/auth/login", { email, password }).then((r) => r.data),
  register: (data: { name: string; email: string; password: string; phone?: string; address?: string }) =>
    api.post<{ token: string; user: ApiUser }>("/auth/register", data).then((r) => r.data),
  me: () => api.get<{ user: ApiUser }>("/auth/me").then((r) => r.data.user),
};

export const orderApi = {
  create: (data: {
    items: { product_id: number; qty: number }[];
    shipping_address: string;
    courier?: string;
    shipping_cost?: number;
  }) => api.post("/orders", data).then((r) => r.data),
  list: () => api.get<{ orders: ApiOrder[] }>("/orders").then((r) => r.data.orders),
  get: (id: number) => api.get<{ order: ApiOrder }>(`/orders/${id}`).then((r) => r.data.order),
  confirm: (id: number) => api.put(`/orders/${id}/confirm`).then((r) => r.data),
  getReviews: (id: number) => api.get<{ reviews: Array<{ id: number; product_id: number; rating: number; comment: string | null; created_at: string }> }>(`/orders/${id}/reviews`).then((r) => r.data.reviews),
  createReview: (id: number, data: { product_id: number; rating: number; comment?: string }) =>
    api.post<{ id: number; product_id: number; rating: number; comment: string | null }>(`/orders/${id}/reviews`, data).then((r) => r.data),
  pay: (id: number) => api.post<{ snap_token: string; snap_redirect_url: string }>(`/orders/${id}/pay`).then((r) => r.data),
};

export const paymentApi = {
  getStatus: (orderCode: string) => api.get<{ payment: any }>(`/payments/status/${orderCode}`).then((r) => r.data.payment),
};

export const shippingApi = {
  calculate: (data: { address?: string; lat?: number; lng?: number }) =>
    api.post<ShippingResult>("/shipping/calculate", data).then((r) => r.data),
};

export const reviewApi = {
  getRecent: () => api.get<{ reviews: Array<{ id: number; product_id: number; product_title: string; user_name: string; rating: number; comment: string | null; created_at: string }> }>("/reviews/recent").then((r) => r.data.reviews),
};

// ── Admin API ──

export interface AdminDashboard {
  total_orders: number;
  paid_orders: number;
  processing_orders: number;
  total_customers: number;
  total_products: number;
  total_revenue: number;
  today_orders: number;
}

export interface OrderShipping {
  courier: string;
  service: string | null;
  cost: number;
  tracking_number: string | null;
  tracking_url: string | null;
  ship_status: "not_shipped" | "shipped" | "delivered";
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  product_id: number;
  qty: number;
  price: number;
  title: string;
  product_status?: string | null;
  eta_po?: string | null;
}

export interface ApiOrder {
  id: number;
  order_code: string;
  order_status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: string;
  courier: string | null;
  payment_status: string | null;
  transaction_id: string | null;
  shipping?: OrderShipping | null;
  items: OrderItem[];
  has_po?: boolean;
  po_eta?: string | null;
  ordered_at: string;
  updated_at: string;
}

export interface AdminOrder {
  id: number;
  user_id: number;
  order_code: string;
  order_status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: string;
  courier: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  ordered_at: string;
  updated_at: string;
  order_items: Array<{
    product_id: number;
    qty: number;
    price: number;
    title: string;
  }>;
  shipping?: {
    ship_status?: string;
    tracking_number?: string;
    tracking_url?: string;
    courier?: string;
    service?: string;
    shipped_at?: string | null;
    delivered_at?: string | null;
  } | null;
  payment?: {
    payment_status?: string;
    transaction_id?: string | null;
  } | null;
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get<AdminDashboard>("/admin/dashboard").then((r) => r.data),

  // Products
  getAdminProducts: () => api.get<{ products: ApiProduct[] }>("/admin/products").then((r) => r.data.products),
  createProduct: (data: any) => api.post<{ product: ApiProduct }>("/admin/products", data).then((r) => r.data.product),
  updateProduct: (id: number, data: any) => api.put<{ product: ApiProduct }>(`/admin/products/${id}`, data).then((r) => r.data.product),
  deleteProduct: (id: number) => api.delete(`/admin/products/${id}`),
  updatePOStatus: (id: number, data: { status: string; slot_po?: number; eta_po?: string }) =>
    api.put<{ product: ApiProduct }>(`/admin/products/${id}/po-status`, data).then((r) => r.data.product),
  updateStock: (id: number, data: { status: string; slot_po?: number }) =>
    api.put<{ product: ApiProduct }>(`/admin/products/${id}/stock`, data).then((r) => r.data.product),

  // Orders
  getAdminOrders: (status?: string, sort?: string) =>
    api.get<{ orders: AdminOrder[] }>("/admin/orders", { params: { status, sort } }).then((r) => r.data.orders),
  getAdminOrder: (id: number) =>
    api.get<{ order: AdminOrder }>(`/admin/orders/${id}`).then((r) => r.data.order),
  updateOrderStatus: (id: number, order_status: string) =>
    api.put<{ order: AdminOrder }>(`/admin/orders/${id}/status`, { order_status }).then((r) => r.data.order),
  updateOrderShipping: (id: number, data: {
    tracking_number?: string;
    tracking_url?: string;
    ship_status: string;
    courier?: string;
    service?: string;
    shipped_at?: string | null;
    delivered_at?: string | null;
    notify?: boolean;
  }) => api.put<{ shipping: any }>(`/admin/orders/${id}/shipping`, data).then((r) => r.data.shipping),
  bulkUpdateShipping: (items: Array<{ order_code: string; tracking_number?: string; tracking_url?: string; courier?: string; ship_status?: string }>) =>
    api.post<{ results: any[] }>(`/admin/orders/bulk-shipping`, { items }).then((r) => r.data.results),
  createBulkShippingJob: (items: Array<{ order_code: string; tracking_number?: string; tracking_url?: string; courier?: string; ship_status?: string }>) =>
    api.post<{ jobId: number }>(`/admin/orders/bulk-shipping-job`, { items }).then((r) => r.data.jobId),
  getBulkShippingJob: (id: number) => api.get<{ job: any }>(`/admin/orders/bulk-shipping-job/${id}`).then((r) => r.data.job),

  // Customers
  getAdminCustomers: () => api.get<{ customers: AdminCustomer[] }>("/admin/customers").then((r) => r.data.customers),
  getAdminCustomer: (id: number) =>
    api.get<{ customer: AdminCustomer & { orders: any[] } }>(`/admin/customers/${id}`).then((r) => r.data.customer),
};
