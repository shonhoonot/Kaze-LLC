# 風 Kaze Shop

> Japan → Mongolia proxy-buying & cargo-consolidation e-commerce platform — **live on Azure.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Azure](https://img.shields.io/badge/Azure_Container_Apps-0078D4?style=flat&logo=microsoftazure&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## 🌐 Live

| | URL |
|---|---|
| **Frontend** | https://kaze-frontend.whiteforest-12c379cf.eastasia.azurecontainerapps.io |
| **Backend API** | https://kaze-backend.whiteforest-12c379cf.eastasia.azurecontainerapps.io |
| **Swagger Docs** | https://kaze-backend.whiteforest-12c379cf.eastasia.azurecontainerapps.io/docs |

---

## Architecture

```
Browser
  │
  ▼
┌─────────────────────────────────┐
│  Azure Container Apps           │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Next.js 14 (Frontend)  │    │
│  │  TypeScript · Tailwind  │    │
│  │  Port 3000              │    │
│  └────────────┬────────────┘    │
│               │ REST API        │
│  ┌────────────▼────────────┐    │
│  │  FastAPI (Backend)      │    │
│  │  Python 3.12 · JWT      │    │
│  │  Port 8000              │    │
│  └────────────┬────────────┘    │
└───────────────┼─────────────────┘
                │
  ┌─────────────▼─────────────┐
  │  Azure Database for       │
  │  PostgreSQL Flexible      │
  │  Server (East Asia)       │
  └───────────────────────────┘

  ┌───────────────────────────┐
  │  Azure Container Registry │
  │  kazeshopacr.azurecr.io   │
  └───────────────────────────┘
```

| Layer | Service | Detail |
|---|---|---|
| Frontend | Azure Container Apps | Next.js 14 standalone, auto-scaling 0→2 replicas |
| Backend | Azure Container Apps | FastAPI + Uvicorn, auto-scaling 0→2 replicas |
| Database | Azure PostgreSQL Flexible Server | v16, Burstable B1ms, East Asia |
| Registry | Azure Container Registry | Basic tier, images built via ACR Tasks |
| Region | East Asia (Hong Kong) | Closest to Mongolia |

---

## What it does

Customers in Mongolia browse genuine Japanese products (Amazon JP, Uniqlo, GU, …), pay in **MNT**, and Kaze LLC:

1. Buys goods in Japan on the customer's behalf
2. Bags each order with a label at the JP warehouse
3. Consolidates bags into a 25 kg cargo box
4. Ships by sea to Mongolia → customer picks up or receives delivery

**Pricing formula (all math in integer JPY):**
```
customer_price = base_price + markup(10%) + service_fee(¥400/item) + shipping(¥350/kg)
display_mnt    = customer_price × fx_rate (default 22.5 ₮/¥)
```
Rules are admin-overridable at **product > category > global** precedence.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| Backend | FastAPI · Python 3.12 · SQLAlchemy 2 · Pydantic v2 |
| Database | PostgreSQL 16 |
| Auth | Phone + OTP → JWT (7-day tokens) |
| Payments | QPay (swappable interface; Stub for dev) |
| Infra | Azure Container Apps · Azure Container Registry · Azure PostgreSQL |
| CI Build | ACR Tasks (cloud Docker build — no local Docker required) |

---

## Local Development

**Prerequisites:** Node 20+, Python 3.9+, PostgreSQL (or [Postgres.app](https://postgresapp.com))

**Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# create local DB
createdb kaze

# start
DATABASE_URL=postgresql+psycopg://<user>@localhost:5432/kaze uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
# → http://localhost:3000
```

**Seed demo data** (3 categories, 12 products, admin user, open box):
```bash
cd backend && source venv/bin/activate
DATABASE_URL=postgresql+psycopg://<user>@localhost:5432/kaze python -m app.seed
```

Demo admin login: phone **+97699000000** — OTP is returned in the API response when `OTP_DEV_MODE=true`.

---

## Deploy to Azure

Images are built in the cloud via ACR Tasks — no local Docker needed.

```bash
# 1. Login
az login

# 2. Build & push backend
az acr build --registry kazeshopacr \
  --image kaze-backend:latest ./backend

# 3. Build & push frontend (with live backend URL)
az acr build --registry kazeshopacr \
  --image kaze-frontend:latest \
  --build-arg "NEXT_PUBLIC_API_BASE_URL=https://kaze-backend.whiteforest-12c379cf.eastasia.azurecontainerapps.io" \
  ./frontend

# 4. Update running containers
az containerapp update --name kaze-backend --resource-group kaze-rg \
  --image kazeshopacr.azurecr.io/kaze-backend:latest

az containerapp update --name kaze-frontend --resource-group kaze-rg \
  --image kazeshopacr.azurecr.io/kaze-frontend:latest
```

---

## Key Routes

**Customer:** `/` · `/category/[slug]` · `/product/[id]` · `/cart` · `/checkout` · `/orders/[id]` · `/account` · `/how-it-works`

**Admin/Staff:** `/admin` (dashboard) · `/admin/products` · `/admin/pricing` · `/admin/orders` (kanban) · `/admin/boxes` (consolidation)

**API:** [Interactive Swagger docs →](https://kaze-backend.whiteforest-12c379cf.eastasia.azurecontainerapps.io/docs)

---

## Order Pipeline

```
PLACED → PAID → PURCHASING_IN_JP → RECEIVED_AT_JP_WAREHOUSE
      → PACKED → SHIPPED_CARGO → ARRIVED_MN → READY_FOR_PICKUP → DELIVERED
```
Each transition writes an `order_event`, shown to the customer as a live tracker. Shipping a box auto-advances all its orders to `SHIPPED_CARGO`.

---

## Roadmap

- Real SMS OTP provider (`SMS_PROVIDER=twilio`)
- Live JPY/MNT FX rate job (`FX_MODE=live`)
- Azure Blob Storage for product images (`STORAGE_BACKEND=azure_blob`)
- Alembic migrations for schema evolution
- LendMN payment provider alongside QPay
- WhatsApp / Telegram customer contact integration
- Referral program UI (schema already in place)
