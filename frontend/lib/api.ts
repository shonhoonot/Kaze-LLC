import type {
  Address,
  Cart,
  Category,
  Order,
  ProductRequest,
  ProductReviews,
  Review,
  Product,
  ProductList,
  User,
  BoxFill,
  Wishlist,
  NotificationList,
} from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const TOKEN_KEY = "kaze_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

interface FetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  // for server components (no localStorage)
  cache?: RequestCache;
}

export async function api<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache ?? "no-store",
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ───────── typed helpers ─────────
export const Api = {
  // catalog
  categories: () => api<Category[]>("/categories", { auth: false }),
  products: (qs: string) => api<ProductList>(`/products?${qs}`, { auth: false }),
  product: (id: number | string) => api<Product>(`/products/${id}`, { auth: false }),
  boxFill: () => api<BoxFill>("/box-fill", { auth: false }),

  // auth
  requestOtp: (phone: string) =>
    api<{ sent: boolean; dev_code: string | null }>("/auth/otp/request", {
      method: "POST",
      auth: false,
      body: { phone },
    }),
  verifyOtp: (phone: string, code: string, name?: string, referred_by?: string) =>
    api<{ access_token: string; user: User }>("/auth/otp/verify", {
      method: "POST",
      auth: false,
      body: { phone, code, name, referred_by },
    }),
  me: () => api<User>("/auth/me"),
  updateProfile: (body: unknown) => api<User>("/auth/me", { method: "PATCH", body }),

  // cart
  cart: () => api<Cart>("/cart"),
  addToCart: (product_id: number, qty = 1, bag_note?: string) =>
    api<Cart>("/cart/items", { method: "POST", body: { product_id, qty, bag_note } }),
  updateCartItem: (id: number, body: { qty?: number; bag_note?: string }) =>
    api<Cart>(`/cart/items/${id}`, { method: "PATCH", body }),
  removeCartItem: (id: number) => api<Cart>(`/cart/items/${id}`, { method: "DELETE" }),

  // notifications
  notifications: () => api<NotificationList>("/notifications"),
  markNotificationRead: (id: number) =>
    api<NotificationList>(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    api<NotificationList>("/notifications/read-all", { method: "POST" }),

  // wishlist
  wishlist: () => api<Wishlist>("/wishlist"),
  addWishlist: (productId: number) => api<Wishlist>(`/wishlist/${productId}`, { method: "POST" }),
  removeWishlist: (productId: number) => api<Wishlist>(`/wishlist/${productId}`, { method: "DELETE" }),

  // orders
  createOrder: (delivery_address: string, delivery_phone: string, coupon_code?: string | null) =>
    api<Order>("/orders", { method: "POST", body: { delivery_address, delivery_phone, coupon_code: coupon_code || null } }),
  orders: () => api<Order[]>("/orders"),
  order: (id: number | string) => api<Order>(`/orders/${id}`),
  cancelOrder: (id: number | string, reason?: string) =>
    api<Order>(`/orders/${id}/cancel`, { method: "POST", body: { reason: reason || null } }),
  reorder: (id: number | string) =>
    api<ReorderResult>(`/cart/reorder/${id}`, { method: "POST" }),

  // reviews
  productReviews: (productId: number | string) =>
    api<ProductReviews>(`/products/${productId}/reviews`),
  submitReview: (productId: number | string, rating: number, comment?: string | null) =>
    api<Review>(`/products/${productId}/reviews`, { method: "POST", body: { rating, comment: comment || null } }),
  deleteReview: (productId: number | string) =>
    api<void>(`/products/${productId}/reviews`, { method: "DELETE" }),

  // product requests
  myRequests: () => api<ProductRequest[]>("/requests"),
  createRequest: (url: string, note?: string) =>
    api<ProductRequest>("/requests", { method: "POST", body: { url, note: note || null } }),

  // coupons
  validateCoupon: (code: string) =>
    api<CouponValidation>("/coupons/validate", { method: "POST", body: { code } }),

  // address book
  addresses: () => api<Address[]>("/addresses"),
  createAddress: (body: unknown) => api<Address>("/addresses", { method: "POST", body }),
  updateAddress: (id: number, body: unknown) => api<Address>(`/addresses/${id}`, { method: "PATCH", body }),
  deleteAddress: (id: number) => api<void>(`/addresses/${id}`, { method: "DELETE" }),

  // payments
  createInvoice: (order_id: number) =>
    api<{ invoice_id: string; qr_text: string; qr_image: string | null; deeplink: string | null; amount_mnt: number }>(
      "/payments/qpay/create-invoice",
      { method: "POST", body: { order_id } }
    ),
  // dev-only helper to simulate the QPay server-to-server callback
  confirmStubPayment: (invoice_id: string, order_id: number) =>
    api<{ ok: boolean }>("/payments/qpay/callback", {
      method: "POST",
      auth: false,
      body: { invoice_id, order_id, payment_status: "PAID" },
    }),
};

export interface PricingRule {
  id: number;
  scope: string;
  scope_ref: number | null;
  markup_percent: number;
  service_fee_per_item_jpy: number;
  shipping_fee_per_kg_jpy: number;
  fx_rate_jpy_mnt: number;
  fx_mode: string;
  updated_at: string;
}

export interface Box {
  id: number;
  code: string;
  status: string;
  capacity_grams: number;
  current_weight_grams: number;
  ship_cost_jpy: number;
  created_at: string;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface Dashboard {
  orders_today: number;
  revenue_today_mnt: number;
  avg_margin_per_order_jpy: number;
  boxes_this_month: number;
  open_box_fill_percent: number;
  pending_orders: number;
  orders_this_month: number;
  revenue_month_mnt: number;
  active_products: number;
  status_counts: StatusCount[];
}

export interface ImportResult {
  created: number;
  errors: string[];
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: "percent" | "fixed_jpy";
  value: number;
  min_subtotal_jpy: number;
  max_discount_jpy: number | null;
  is_active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
}

export interface ReorderResult {
  added: number;
  skipped: number;
  cart: Cart;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  discount_jpy: number;
  discount_mnt: number;
  message: string;
}

export interface ScrapedProduct {
  source: string;
  source_url: string;
  title_ja: string | null;
  title_mn: string | null;
  brand: string | null;
  base_price_jpy: number | null;
  image_url: string | null;
  weight_grams: number;
  fetched: boolean;
  note: string | null;
}

export const AdminApi = {
  dashboard: () => api<Dashboard>("/admin/dashboard"),
  products: (qs = "") => api<ProductList>(`/admin/products${qs ? `?${qs}` : ""}`),
  scrapeProduct: (url: string) =>
    api<ScrapedProduct>("/admin/products/scrape", { method: "POST", body: { url } }),
  createProduct: (body: unknown) => api<Product>("/admin/products", { method: "POST", body }),
  updateProduct: (id: number, body: unknown) => api<Product>(`/admin/products/${id}`, { method: "PATCH", body }),
  deleteProduct: (id: number) => api<void>(`/admin/products/${id}`, { method: "DELETE" }),
  importProductsCsv: async (file: File): Promise<ImportResult> => {
    const fd = new FormData();
    fd.append("file", file);
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE}/admin/products/import`, { method: "POST", headers, body: fd });
    if (!res.ok) throw new ApiError(`${res.status}`, res.status);
    return res.json();
  },
  coupons: () => api<Coupon[]>("/admin/coupons"),
  createCoupon: (body: unknown) => api<Coupon>("/admin/coupons", { method: "POST", body }),
  updateCoupon: (id: number, body: unknown) => api<Coupon>(`/admin/coupons/${id}`, { method: "PATCH", body }),
  requests: (status?: string) =>
    api<ProductRequest[]>(`/admin/requests${status ? `?status=${status}` : ""}`),
  updateRequest: (id: number, body: unknown) =>
    api<ProductRequest>(`/admin/requests/${id}`, { method: "PATCH", body }),
  pricingRules: () => api<PricingRule[]>("/admin/pricing-rules"),
  upsertPricingRule: (body: unknown) => api<PricingRule>("/admin/pricing-rules", { method: "PUT", body }),
  orders: (status?: string) => api<Order[]>(`/admin/orders${status ? `?status=${status}` : ""}`),
  updateOrderStatus: (id: number, status: string, note?: string) =>
    api<Order>(`/admin/orders/${id}/status`, { method: "PATCH", body: { status, note } }),
  addOrderPhoto: (id: number, url: string, caption?: string) =>
    api<Order>(`/admin/orders/${id}/photos`, { method: "POST", body: { url, caption } }),
  boxes: () => api<Box[]>("/admin/boxes"),
  createBox: () => api<Box>("/admin/boxes", { method: "POST" }),
  addBoxItem: (boxId: number, order_id: number, bag_label?: string) =>
    api<Box>(`/admin/boxes/${boxId}/items`, { method: "POST", body: { order_id, bag_label } }),
  shipBox: (boxId: number) => api<Box>(`/admin/boxes/${boxId}/ship`, { method: "PATCH" }),
};
