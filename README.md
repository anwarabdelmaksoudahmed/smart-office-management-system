# Smart Office Café & Gaming Management System

Enterprise management platform for café ordering, recipe-driven inventory, and gaming-area reservations. Built for 300+ employees, designed to scale to 10,000+ users.

## Applications

| Portal | Audience |
|--------|----------|
| Employee Portal | Browse menu, order, rewards, gaming booking |
| Barista Dashboard | Live queue, prepare, deliver, print tickets |
| Inventory Dashboard | Stock, recipes, purchases, waste, alerts |
| Gaming Dashboard | Rooms, devices, sessions, waiting queue |
| Admin Dashboard | Users, RBAC, analytics, audit, settings |

## Tech Stack

**Frontend:** Vue 3 · TypeScript · Vite · Pinia · Vue Router · TanStack Query · PrimeVue · Tailwind · Vue I18n · VeeValidate  

**Backend:** NestJS · Prisma · PostgreSQL · Redis · JWT · Socket.io · Swagger · Winston · Docker  

## Phase 1 Complete (Architecture Foundation)

See docs in `/docs`. Prisma schema, ERD, API contract, monorepo layout.

## Phase 2 Complete (Backend Bootstrap)

NestJS API with Auth (JWT + refresh rotation), RBAC guards, Users/Roles/Permissions, Health, Swagger, seed data.

```bash
pnpm install
pnpm build:shared
pnpm docker:up
pnpm db:generate
cd apps/api && pnpm exec prisma migrate deploy && cd ../..
pnpm db:seed
pnpm dev:api
```

- Swagger: http://localhost:3000/api/docs  
- Guide: [docs/07-PHASE-2-BACKEND.md](docs/07-PHASE-2-BACKEND.md)  
- Demo password: `Admin@12345` (see guide for emails)

## Phase 3 Complete (Frontend Bootstrap)

Vue 3 SPA with five portal shells, EN/AR + RTL/LTR, light/dark theme, login, auth guards.

```bash
pnpm --filter @smart-office/web dev
```

- App: http://localhost:5173  
- Guide: [docs/08-PHASE-3-FRONTEND.md](docs/08-PHASE-3-FRONTEND.md)

## Phase 4 Complete (Catalog)

Categories, Menu, Recipes APIs + Admin/Inventory/Employee UI. Seed includes Latte recipe.

Guide: [docs/09-PHASE-4-CATALOG.md](docs/09-PHASE-4-CATALOG.md)

## Phase 5 Complete (Orders)

Order lifecycle, inventory deduct on prepare, Socket.io, Employee cart, Barista queue.

Guide: [docs/10-PHASE-5-ORDERS.md](docs/10-PHASE-5-ORDERS.md)

## Phase 6 Complete (Inventory)

Stock adjust, movements, low/expiry alerts (socket), Inventory portal UI.

Guide: [docs/11-PHASE-6-INVENTORY.md](docs/11-PHASE-6-INVENTORY.md)

## Phase 7 Complete (Procurement)

Suppliers, purchase orders (receive → stock IN), waste (stock OUT).

Guide: [docs/12-PHASE-7-PROCUREMENT.md](docs/12-PHASE-7-PROCUREMENT.md)

## Phase 8 Complete (Gaming)

Rooms, devices, bookings, waiting queue, session timer + Socket.io `/gaming`.

Guide: [docs/13-PHASE-8-GAMING.md](docs/13-PHASE-8-GAMING.md)

## Phase 9 Complete (Employee polish)

Rewards points, free drinks at checkout, rating bonuses.

Guide: [docs/14-PHASE-9-EMPLOYEE.md](docs/14-PHASE-9-EMPLOYEE.md)

## Phase 10 Complete (Admin)

Dashboard KPIs, reports, audit logs, settings, users & roles UI.

Guide: [docs/15-PHASE-10-ADMIN.md](docs/15-PHASE-10-ADMIN.md)

## Phase 11 Complete (UI kit)

Shared page/header/KPI/empty/toolbar components + design tokens across portals.

Guide: [docs/16-PHASE-11-UI-KIT.md](docs/16-PHASE-11-UI-KIT.md)

## Phase 12 Complete (Tests)

Unit tests (shared / API / web) + Playwright login smoke + optional API live smoke.

Guide: [docs/17-PHASE-12-TESTS.md](docs/17-PHASE-12-TESTS.md)

## Architecture Decisions (why)

1. **Modular monolith (NestJS)** — cross-module transactions (orders ↔ inventory) stay simple; extract workers later.
2. **Single Vue SPA, five portal shells** — one build, role-gated layouts; shared design system.
3. **Recipe snapshots on order lines** — historical accuracy when recipes change.
4. **Optimistic locking on stock** — safe concurrent deductions under load.
5. **Permission codes, not role checks in features** — RBAC stays flexible as the org grows.
6. **Storage interface** — local now, S3 later without rewriting callers.

## Order Lifecycle

```
Pending → Accepted → Preparing → Ready → Collected → Completed → Archived
                 ↘ Rejected / Cancelled
```

Inventory deducts on **Preparing** (configurable).

## Next Step

**Phase 13 — Dockerfiles + CI/CD:** multi-stage images and GitHub Actions pipeline.

Reply with `Continue Phase 13` to proceed.
