# Delivery Roadmap

Build incrementally. Do not skip architecture.

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **1** | Requirements, Architecture, ERD, Folder structure, Prisma schema, API contract | ✅ Done |
| **2** | NestJS bootstrap, Auth (JWT+refresh), RBAC guards, PrismaService, Users/Roles seed | ✅ Done |
| **3** | Vue 3 bootstrap, layouts, i18n AR/EN RTL/LTR, theme light/dark, auth pages | ✅ Done |
| **4** | Catalog: Categories, Menu, Recipes | ✅ Done |
| **5** | Orders workflow + Socket.io + Barista queue | ✅ Done |
| **6** | Inventory automation (recipe deduction), alerts | ✅ Done |
| **7** | Purchases, Suppliers, Waste | ✅ Done |
| **8** | Gaming rooms, bookings, queue, session timer | ✅ Done |
| **9** | Employee portal: cart, favorites, rewards, free drinks, ratings | ✅ Done |
| **10** | Admin dashboard, reports, audit logs, settings | ✅ Done |
| **11** | Reusable UI kit polish + all portal pages | ✅ Done |
| **12** | Unit/E2E tests | ✅ Done |
| **13** | Dockerfiles + CI/CD | ⏭ Next |

## Phase 2 exit criteria

- [x] NestJS bootstrap (Helmet, CORS, ValidationPipe, Winston, Throttler)
- [x] Auth: login / refresh (rotate) / logout / me
- [x] RBAC: JwtAuthGuard + PermissionsGuard + `@RequirePermissions`
- [x] Users / Roles / Permissions CRUD APIs
- [x] Seed: 8 roles + permission matrix + demo users
- [x] Health check (Postgres + Redis)
- [x] Swagger at `/api/docs`
- [x] Socket.io notifications namespace stub
- [ ] Verified locally (`docker:up` + migrate + seed + boot) — run setup

## Phase 3 exit criteria

- [x] Vue 3 + Vite + TypeScript + Tailwind + PrimeVue
- [x] Pinia auth store + Axios interceptors (refresh)
- [x] Vue Router with auth + role guards
- [x] Five portal layouts (Employee, Barista, Inventory, Gaming, Admin)
- [x] Login page (VeeValidate + Yup)
- [x] EN / AR i18n with RTL / LTR
- [x] Light / Dark theme
## Phase 4 exit criteria

- [x] Categories CRUD API + Admin UI
- [x] Menu CRUD API + Admin UI + Employee browse
- [x] Favorites add/remove/list
- [x] Recipes upsert with ingredient lines
- [x] Ingredients list/create (recipe dependency)
- [x] Catalog seed data (Latte recipe example)
- [x] API + Web production builds

## Phase 5 exit criteria

- [x] Order create with menu + recipe snapshots
- [x] Full status transitions + history
- [x] Inventory deduction on PREPARING
- [x] Barista queue API + avg prep metric
- [x] Socket.io `/orders` events
- [x] Employee cart + orders UI
- [x] Barista kanban queue UI
- [x] Builds pass

## Phase 6 exit criteria

- [x] Inventory stock / adjust / movements / alerts / daily APIs
- [x] Low-stock + expiry alerts (API + Socket.io)
- [x] Alerts emitted after order prepare deduction
- [x] Inventory portal: stock, alerts, movements, ingredients
- [x] Dashboard daily KPIs
- [x] Builds pass

## Phase 7 exit criteria

- [x] Suppliers CRUD API + UI
- [x] Purchase orders create / receive / cancel
- [x] Receive increases stock (PURCHASE movement)
- [x] Waste records deduct stock (WASTE movement)
- [x] Seed suppliers + sample PO
- [x] Builds pass

## Phase 8 exit criteria

- [x] Rooms + devices CRUD
- [x] Availability slots API
- [x] Reservations create / cancel / start / extend / complete
- [x] Waiting queue join / notify / seat
- [x] Socket.io `/gaming` events
- [x] Gaming portal + Employee gaming UI with session timer
- [x] Seed rooms/devices/sample booking
- [x] Builds pass

## Phase 9 exit criteria

- [x] Employee balance + redeem APIs
- [x] Points earned on order complete + rating
- [x] Free drink apply at checkout
- [x] Rewards page + dashboard widgets
- [x] Orders history ratings polish
- [x] Builds pass

## Phase 10 exit criteria

- [x] Portal dashboard KPIs API
- [x] Reports (orders, sales, inventory, gaming)
- [x] Settings GET/PATCH + audit on change
- [x] Audit logs list API
- [x] Admin UI: dashboard, users, roles, reports, audit, settings
- [x] Builds pass

## Phase 11 exit criteria

- [x] Shared UI kit components (header, hero, KPI, section, toolbar, empty, status)
- [x] Design token / utility polish + motion
- [x] Portal dashboards use kit + live KPIs
- [x] Reference pages migrated (cart, rewards, suppliers)
- [x] Builds pass

## Phase 12 exit criteria

- [x] Shared order-transition unit tests
- [x] API Jest: permissions guard, pagination, rewards
- [x] Web Vitest: cart store + PageHeader
- [x] Playwright login smoke (dedicated port)
- [x] Optional API live e2e smoke
- [x] Root `pnpm test` / `pnpm test:e2e` scripts
