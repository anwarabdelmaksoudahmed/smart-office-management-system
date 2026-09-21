# Phase 6 — Inventory Automation & Alerts

## Already from Phase 5

Recipe-driven stock deduction on order **PREPARING** (optimistic lock + `StockMovement` OUT).

## Phase 6 additions

### API (`/api/v1/inventory`)

| Endpoint | Purpose |
|----------|---------|
| `GET /stock` | List stock (+ low / expiring filters) |
| `POST /adjust` | Manual IN/OUT/ADJUSTMENT |
| `PATCH /stock/:id` | Expiry date + location |
| `GET /movements` | Movement history |
| `GET /alerts` | Low stock / expiring / expired |
| `GET /daily` | Daily summary KPIs |

### Realtime

Socket.io namespace `/inventory` → `inventory.alert`  
Emitted after adjust and after order preparation when stock crosses thresholds.

### Frontend (Inventory portal)

- Dashboard KPIs (daily summary)
- Stock list + adjust + expiry editor
- Alerts board (low / expiring / expired)
- Movements ledger
- Ingredients CRUD

### Seed demo signals

- Chocolate syrup: qty **400** ≤ reorder **500** → low stock
- Milk: expires in **4 days** → expiring soon

## Try it

1. Login `inventory@smartoffice.local` → Dashboard / Stock / Alerts  
2. Adjust stock or prepare an order as barista → watch alerts refresh via socket  
