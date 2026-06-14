# 風 Kaze Shop

Japan → Mongolia proxy-buying & cargo-consolidation e-commerce platform for **Kaze LLC**.

Customers in Mongolia browse Japanese products (Amazon JP, Uniqlo, GU, …), order in **MNT**,
and Kaze LLC buys the goods in Japan, bags them per customer, consolidates bags into a 25 kg
box, and ships by sea cargo. Customers pay: **product cost + markup + per-item service fee +
weight-based shipping fee.**

UI language: **Mongolian (Cyrillic)**. Prices in **MNT** (JPY shown as secondary).

---

## Stack

| Layer    | Tech                                                        |
| -------- | ----------------------------------------------------------- |
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS         |
| Backend  | FastAPI (Python 3.12) · SQLAlchemy 2                        |
| DB       | PostgreSQL 16                                               |
| Auth     | Phone + OTP (+976) → JWT                                    |
| Payments | QPay (provider-swappable interface; Stub for dev)           |
| Deploy   | Docker (backend + frontend + Postgres via docker-compose)   |

---

## Quick start (Docker)

```bash
cp .env.example .env          # then edit secrets
docker compose up --build
# backend  → http://localhost:8000  (docs at /docs)
# frontend → http://localhost:3000

# seed demo data (3 categories, 12 products, admin user, open box)
docker compose exec backend python -m app.seed
```

Demo admin: log in with phone **+97699000000** (OTP is returned in the API
response while `OTP_DEV_MODE=true`).

## Local dev (without Docker)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://kaze:kaze_dev_password@localhost:5432/kaze
python -m app.seed
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

---

## The pricing engine (`backend/app/pricing.py`)

The single source of truth for customer-facing prices. **All money math is integer JPY**;
MNT is computed only at the very end (for display/charging).

```
markup_jpy        = round(base_price_jpy * markup_percent)        # per unit, × qty
service_fee_jpy   = service_fee_per_item_jpy * qty
shipping_fee_jpy  = round(weight_grams/1000 * shipping_fee_per_kg) # per unit, × qty
line_total_jpy    = base*qty + markup + service_fee + shipping_fee
display_mnt       = round(line_total_jpy * fx_rate_jpy_mnt)
```

Defaults (admin-editable in `/admin/pricing`): markup 10%, service fee ¥400/item,
shipping ¥350/kg, FX 22.5 ₮/¥. Rules are overridable at **product > category > global**
precedence (see `services/pricing_service.py`).

Run the unit tests:
```bash
cd backend && python -m pytest
```

---

## Order pipeline

`PLACED → PAID → PURCHASING_IN_JP → RECEIVED_AT_JP_WAREHOUSE → PACKED → SHIPPED_CARGO →
ARRIVED_MN → READY_FOR_PICKUP → DELIVERED` (+ `CANCELLED`, `REFUNDED`).

Each transition writes an `order_event`, surfaced to the customer as a visual tracker
(`/orders/[id]`). Shipping a box auto-advances all its orders to `SHIPPED_CARGO`.

---

## Key routes

**Customer:** `/` · `/category/[slug]` (filter + sort) · `/product/[id]` · `/cart` ·
`/checkout` · `/orders` · `/orders/[id]` · `/account` · `/wishlist` ·
`/notifications` · `/login` · `/how-it-works` · `/faq` · `/shipping-info`

**Admin/staff:** `/admin` (dashboard) · `/admin/products` · `/admin/pricing` ·
`/admin/orders` (kanban) · `/admin/boxes` (consolidation tool)

**API:** see interactive docs at `http://localhost:8000/docs`.

---

## Admin: bulk add products

- **Manual**: `/admin/products` — paste an Amazon JP / Uniqlo / GU URL and fill in
  title/price/weight/image (no scraping — respects retailer ToS).
- **CSV**: `POST /admin/products/import` (multipart `file`). See
  `backend/sample_products.csv` for the column format.

---

## Deployment notes

- Containerized for **Azure Container Apps** or a **Contabo VPS** (Docker + nginx).
- Frontend builds as a Next.js standalone server.
- Backend exposes `/health` for health checks.
- Object storage: `STORAGE_BACKEND=local` (served at `/uploads`) or `azure_blob`.
- **Secrets** live in env vars / Key Vault — never hardcoded. See `.env.example`.
- For production schema evolution, add Alembic migrations (v1 uses `create_all`).

## Conversion / UX features

- **Estimated ship & arrival date** — projected from the open box's fill rate
  (`BOX_FILL_GRAMS_PER_DAY` + `JP_HANDLING_DAYS` + `SEA_TRANSIT_DAYS`); shown on
  the home/cart box-fill bar to drive urgency.
- **Wishlist** — save products (`♡`), view at `/wishlist` (`/wishlist` API).
- **Sort** — products by newest / price asc / price desc.
- **Referral program** — each user gets a code + shareable link
  (`/login?ref=CODE`); referrer earns credit, referee gets a one-time
  service-fee discount on their first order.

## Order tracking & trust features

- **Status timeline** — every order advance (placed → paid → purchasing →
  received → packed → shipped → arrived → delivered) writes an `OrderEvent`,
  rendered as a vertical tracker on the order detail page.
- **In-app notifications** — each status change (and warehouse photo) creates a
  `Notification`; customers see a 🔔 bell with an unread badge (polled every
  60s) and a `/notifications` feed (`/notifications` API + mark-read).
- **Warehouse photos** — staff attach proof photos to an order
  (`POST /admin/orders/{id}/photos`); shown as a gallery on the order page to
  build buyer trust. All status side-effects are centralised in
  `services/notifications.record_order_event`.

## Roadmap hooks (left intentionally open)

- Real SMS provider for OTP (`SMS_PROVIDER`).
- Live FX daily job writing into the global pricing rule (`FX_MODE=live`).
- Product importer/scraper — **manual + CSV only** for v1 (ToS-safe).
- LendMN payment provider (add alongside QPay behind `PaymentProvider`).
- NOVA agent / WhatsApp · Messenger · Telegram contact integration.
- Referral program (codes + credits) — schema in place, UI on `/account`.
