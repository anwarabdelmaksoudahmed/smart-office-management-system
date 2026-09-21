# System Architecture

## Style

**Modular Monolith (NestJS)** + **SPA (Vue 3)** in a **pnpm monorepo**.

Why modular monolith first:
- Single deployable API with clear module boundaries
- Easier transactions across Orders ↔ Inventory
- Can extract services later (Notifications, Reports) without rewriting domain

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients (SPA)                            │
│  Employee │ Barista │ Inventory │ Gaming │ Admin  portals       │
│              Vue 3 + Pinia + TanStack Query + Socket.io          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / WSS
┌────────────────────────────▼────────────────────────────────────┐
│                     API Gateway layer                             │
│         NestJS: Helmet, CORS, RateLimit, ValidationPipe           │
│                    /api/v1/*  +  Socket.io                        │
└───┬──────────────┬──────────────┬──────────────┬────────────────┘
    │              │              │              │
┌───▼───┐    ┌─────▼─────┐  ┌─────▼─────┐  ┌───▼────────┐
│ Auth  │    │  Domain   │  │ Realtime  │  │  Infra     │
│ JWT   │    │  Modules  │  │ Gateway   │  │ Uploads    │
│ RBAC  │    │ (feature) │  │ Redis     │  │ Logger     │
└───┬───┘    └─────┬─────┘  └─────┬─────┘  └────────────┘
    │              │              │
┌───▼──────────────▼──────────────▼───────────────────────────────┐
│                     PostgreSQL  +  Redis                          │
└─────────────────────────────────────────────────────────────────┘
```

## Monorepo Layout

```
/
├── apps/
│   ├── api/                 # NestJS backend
│   └── web/                 # Vue 3 frontend (multi-portal)
├── packages/
│   ├── shared/              # Shared DTOs, enums, zod/yup schemas
│   └── config/              # ESLint, TSConfig, Prettier presets
├── docker/                  # Compose, Dockerfiles
├── docs/                    # Architecture, ERD, API
├── scripts/                 # Seed, migrate helpers
└── package.json             # pnpm workspace root
```

## Backend Module Map (NestJS)

| Module | Responsibility |
|--------|----------------|
| `auth` | Login, refresh, logout, password reset stubs |
| `users` | User CRUD, profile |
| `roles` | Role definitions |
| `permissions` | Permission catalog + role binding |
| `employees` | Employee profile, dept, balances |
| `orders` | Cart, checkout, lifecycle, ratings |
| `menu` | Menu items, availability |
| `categories` | Category tree |
| `recipes` | Recipe + recipe lines |
| `inventory` | Stock levels, movements, alerts |
| `ingredients` | Ingredient master |
| `suppliers` | Supplier master |
| `purchases` | PO create/receive |
| `waste` | Waste logging |
| `gaming` | Rooms, devices, bookings, queue |
| `reservations` | Gaming reservation orchestration |
| `notifications` | Persist + emit notifications |
| `dashboard` | Aggregated KPIs |
| `reports` | Scheduled/on-demand reports |
| `settings` | App configuration |
| `audit-logs` | Immutable audit trail |
| `uploads` | Storage abstraction (local → S3) |

### Clean Architecture Layers (per module)

```
controllers/     → HTTP adapters
gateways/        → Socket adapters (where needed)
dto/             → Validation (class-validator)
services/        → Use cases / application logic
repositories/    → Prisma data access (optional thin wrappers)
entities/        → Domain types (optional; Prisma models as source)
```

**DI:** NestJS providers. **Repository pattern:** Prisma repositories behind interfaces for testability on critical paths (orders, inventory).

## Frontend Architecture

### Portal routing strategy

Single Vue app with **role-based portal shells**:

```
/login
/employee/*     → EmployeeLayout
/barista/*      → BaristaLayout
/inventory/*    → InventoryLayout
/gaming/*       → GamingLayout
/admin/*        → AdminLayout
```

Route guards check JWT + permission codes. Users with multiple roles see a portal switcher.

### Feature folders (`apps/web/src/modules/`)

Mirror backend modules. Each feature owns:

```
modules/orders/
  api/           # axios + tanstack query keys
  components/
  composables/
  pages/
  stores/        # pinia (UI state only; server state → TanStack Query)
  types/
```

### Shared UI (`apps/web/src/shared/`)

- Layouts, tables, forms, dialogs, theme, i18n
- Design tokens via CSS variables + Tailwind + PrimeVue theme

## Auth & Security

| Concern | Approach |
|---------|----------|
| Access token | JWT, short-lived (15m), `Authorization: Bearer` |
| Refresh token | Opaque, hashed in DB, rotate on use, HttpOnly cookie optional |
| RBAC | `permission.code` checks on guards; roles aggregate permissions |
| Rate limiting | `@nestjs/throttler` + Redis store |
| Hardening | Helmet, CORS whitelist, ValidationPipe whitelist/forbid |
| Audit | Interceptor writes actor, action, resource, IP, payload hash |

## Realtime

Socket.io namespaces:

- `/orders` — barista queue, employee tracking
- `/inventory` — low stock / expiry alerts
- `/gaming` — booking/queue/timer
- `/notifications` — user inbox

Rooms: `user:{id}`, `role:barista`, `order:{id}`, `gaming:room:{id}`.

Redis adapter for horizontal scale.

## Inventory Automation

1. Menu item → Recipe (1:1 active) → RecipeLines (ingredient + qty + unit)
2. On `PREPARING`, open transaction:
   - Snapshot recipe lines onto order items
   - Create `StockMovement` (OUT) per ingredient
   - Decrement `StockItem.quantity`
   - Emit alert if below `reorderLevel`
3. Optimistic locking via `StockItem.version`

## Storage Abstraction

```ts
interface StorageService {
  upload(file, path): Promise<StoredObject>
  delete(key): Promise<void>
  getUrl(key): Promise<string>
}
```

Implementations: `LocalStorageService` (now), `S3StorageService` (later).

## Observability

- Winston structured logs (request id, user id)
- Health: `/api/v1/health` (DB + Redis)
- Metrics-ready hooks (OpenTelemetry later)

## Deployment

```
Docker Compose (dev): api, web, postgres, redis
Production-ready: multi-stage Dockerfiles, env-based config
CI/CD: lint → typecheck → test → build → migrate → deploy
```

## Scalability Path (future)

1. Stateless API replicas + Redis Socket adapter
2. Read replicas for reports
3. Extract report worker / notification worker
4. CDN for SPA + static uploads (or S3)
