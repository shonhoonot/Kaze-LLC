import type { Product } from "./types";

const KEY = "kaze_recently_viewed";
const MAX = 8;

/** Read the recently-viewed products (most recent first). Safe on the server. */
export function getRecentlyViewed(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

/** Record a product view: move it to the front, dedupe by id, cap the list. */
export function addRecentlyViewed(product: Product): void {
  if (typeof window === "undefined") return;
  try {
    const list = getRecentlyViewed().filter((p) => p.id !== product.id);
    list.unshift(product);
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* storage unavailable / quota — ignore */
  }
}
