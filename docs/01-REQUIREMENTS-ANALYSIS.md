# Requirements Analysis

## Project

**Smart Office Café & Gaming Management System**  
Enterprise platform for a company of 300+ employees (designed for 10,000+ users).

## Problem Statement

Manual café ordering, inventory tracking, and gaming-area booking create operational friction:

- Baristas lack a live queue and preparation metrics
- Inventory is not tied to recipes → stockouts and waste
- Employees have no self-service ordering, rewards, or gaming booking
- Admins lack unified analytics, RBAC, and auditability

## Goals

| Goal | Success Metric |
|------|----------------|
| End-to-end order automation | Order lifecycle fully tracked; < 2s API p95 |
| Recipe-driven inventory | Auto-deduction on prepare; stock alerts |
| Multi-app UX | 5 portals with role-gated access |
| Realtime operations | Socket events for orders, inventory, gaming |
| Enterprise security | JWT + refresh, RBAC, rate limits, audit logs |
| i18n / a11y | AR/EN, RTL/LTR, light/dark |

## Non-Goals (Phase 1–2)

- Native mobile apps (responsive web first)
- Live payment gateway (wallet/balance model first)
- S3 storage (local abstraction with S3-ready interface)
- SMS/Email delivery (adapters stubbed)

## Actors & Applications

| Application | Primary Roles | Purpose |
|-------------|---------------|---------|
| Employee Portal | Employee, Guest | Order, favorites, gaming, rewards |
| Barista Dashboard | Barista | Queue, prepare, deliver, tickets |
| Inventory Dashboard | Inventory Manager | Stock, purchases, waste, recipes |
| Gaming Dashboard | Gaming Supervisor | Rooms, devices, sessions, queue |
| Admin Dashboard | Super Admin, Admin, HR | Users, RBAC, analytics, settings |

## Functional Domains

1. **Identity & Access** — Auth, users, roles, permissions, sessions
2. **HR / Employees** — Profiles, departments, free-drink balance, rewards
3. **Catalog** — Categories, menu items, recipes, favorites
4. **Orders** — Cart, schedule, lifecycle, ratings, history
5. **Inventory** — Ingredients, products, movements, expiry, barcodes
6. **Procurement** — Suppliers, purchase orders, receiving
7. **Waste** — Waste events linked to ingredients/products
8. **Gaming** — Rooms, devices, bookings, waiting queue, timers
9. **Notifications** — In-app, socket, push-ready, email/SMS-ready
10. **Analytics** — Dashboards, reports (D/W/M/Y)
11. **Platform** — Settings, uploads, audit logs

## Order State Machine

```
PENDING → ACCEPTED → PREPARING → READY → COLLECTED → COMPLETED → ARCHIVED
                ↘ REJECTED (terminal)
         CANCELLED (from PENDING/ACCEPTED; employee or barista)
```

**Inventory deduction trigger:** transition `ACCEPTED → PREPARING` (or configurable `on_ready`). Default: on prepare.

## Constraints & SLAs

- Concurrent users: design for 1,000 concurrent, 10,000 registered
- Soft deletes for audit-critical entities
- Soft real-time: Socket.io; Redis adapter for multi-instance
- API versioning: `/api/v1`
- Pagination defaults: page size 20, max 100

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Stock race conditions | Prisma transactions + row locks / optimistic versioning |
| Socket fan-out at scale | Redis pub/sub adapter; room-scoped events |
| Permission sprawl | Permission codes + role templates; seed defaults |
| Recipe/ingredient drift | Versioned recipes; snapshot on order line |
| Monolith complexity | Feature modules + clear bounded contexts |

## Acceptance Criteria (MVP Slice)

1. Employee can browse menu, order, track status in realtime
2. Barista can accept → prepare → ready → collected
3. Preparing an order deducts recipe ingredients
4. Inventory manager sees stock alerts
5. Employee can book a gaming slot and see QR/session timer
6. Admin can manage users/roles and view audit log
7. AR/EN + dark/light work on all portals
