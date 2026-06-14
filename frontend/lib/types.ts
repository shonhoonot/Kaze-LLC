export interface PriceBreakdown {
  base_price_jpy: number;
  markup_jpy: number;
  service_fee_jpy: number;
  shipping_fee_jpy: number;
  unit_total_mnt: number;
  line_total_jpy: number;
  line_total_mnt: number;
}

export interface ProductImage {
  id: number;
  url: string;
  sort_order: number;
}

export interface Product {
  id: number;
  source: string;
  source_url: string | null;
  sku: string | null;
  title_mn: string;
  title_ja: string | null;
  brand: string | null;
  category_id: number | null;
  base_price_jpy: number;
  weight_grams: number;
  dimensions: string | null;
  reference_price_mnt: number | null;
  in_stock: boolean;
  is_active: boolean;
  images: ProductImage[];
  price: PriceBreakdown | null;
}

export interface ProductList {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
}

export interface Category {
  id: number;
  name_mn: string;
  name_ja: string | null;
  slug: string;
  parent_id: number | null;
  icon: string | null;
}

export interface BoxFill {
  current_weight_grams: number;
  capacity_grams: number;
  fill_percent: number;
  remaining_grams: number;
  est_days_to_full?: number | null;
  est_ship_date?: string | null;
  est_arrival_date?: string | null;
}

export interface Wishlist {
  product_ids: number[];
  items: Product[];
}

export interface CartLine {
  id: number;
  product_id: number;
  title_mn: string;
  qty: number;
  weight_grams: number;
  image_url: string | null;
  bag_note: string | null;
  price: PriceBreakdown;
}

export interface Cart {
  id: number;
  lines: CartLine[];
  subtotal_jpy: number;
  markup_jpy: number;
  service_fee_jpy: number;
  shipping_fee_jpy: number;
  est_weight_grams: number;
  total_jpy: number;
  total_mnt: number;
  fx_rate_used: number;
  box_fill: BoxFill | null;
}

export interface OrderItem {
  id: number;
  product_id: number;
  title_mn_snapshot: string | null;
  qty: number;
  unit_price_jpy: number;
  line_total_jpy: number;
  weight_grams: number;
}

export interface OrderEvent {
  id: number;
  status: string;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  status: string;
  subtotal_jpy: number;
  markup_jpy: number;
  service_fee_jpy: number;
  est_weight_grams: number;
  shipping_fee_jpy: number;
  total_jpy: number;
  total_mnt: number;
  fx_rate_used: number;
  delivery_address: string | null;
  delivery_phone: string | null;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
  events: OrderEvent[];
}

export interface User {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
  default_address: string | null;
  city: string | null;
  district: string | null;
  referral_code: string | null;
  referral_credit_jpy: number;
}

export const ORDER_PIPELINE = [
  "PLACED",
  "PAID",
  "PURCHASING_IN_JP",
  "RECEIVED_AT_JP_WAREHOUSE",
  "PACKED",
  "SHIPPED_CARGO",
  "ARRIVED_MN",
  "READY_FOR_PICKUP",
  "DELIVERED",
] as const;

export const ORDER_STATUS_MN: Record<string, string> = {
  PLACED: "Захиалсан",
  PAID: "Төлбөр төлсөн",
  PURCHASING_IN_JP: "Японд худалдан авч байна",
  RECEIVED_AT_JP_WAREHOUSE: "Японы агуулахад хүлээн авсан",
  PACKED: "Савласан",
  SHIPPED_CARGO: "Ачаагаар явсан",
  ARRIVED_MN: "Монголд ирсэн",
  READY_FOR_PICKUP: "Авахад бэлэн",
  DELIVERED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
  REFUNDED: "Буцаагдсан",
};
