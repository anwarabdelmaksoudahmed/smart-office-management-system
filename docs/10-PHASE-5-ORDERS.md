# Phase 5 — Orders & Barista Queue

## Order lifecycle

```
PENDING → ACCEPTED → PREPARING → READY → COLLECTED → COMPLETED → ARCHIVED
       ↘ REJECTED / CANCELLED
```

## Backend

| Feature | Detail |
|---------|--------|
| Place order | Snapshots menu names/prices + recipe lines |
| Transitions | Validated via `@smart-office/shared` `ORDER_TRANSITIONS` |
| Prepare | Deducts inventory from recipe snapshots (optimistic lock) |
| Queue | Live barista queue + avg prep time (7-day window) |
| Realtime | Socket.io namespace `/orders` — `order.created`, `order.updated`, `order.ready` |
| Rooms | `role:barista`, `user:{id}` |

## Frontend

| Portal | Pages |
|--------|-------|
| Employee | Menu (+ cart), Cart checkout, Orders history (cancel/repeat/rate) |
| Barista | Kanban queue (Pending → Ready) with accept/reject/prepare/ready/collect |

Realtime: `socket.io-client` joins barista/user rooms and invalidates TanStack Query.

## Try it

1. Login as `employee@smartoffice.local` → Menu → add Latte → Cart → Place order  
2. Login as `barista@smartoffice.local` → Queue → Accept → Prepare → Ready → Collected  
