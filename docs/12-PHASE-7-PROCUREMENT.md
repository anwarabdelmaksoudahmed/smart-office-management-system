# Phase 7 — Purchases, Suppliers, Waste

## APIs

| Module | Endpoints |
|--------|-----------|
| Suppliers | `GET/POST /suppliers`, `PATCH/DELETE /suppliers/:id` |
| Purchases | `GET/POST /purchases`, `POST /:id/receive`, `POST /:id/cancel` |
| Waste | `GET/POST /waste` |

## Stock effects

- **Receive PO** → `StockMovement` type `PURCHASE` + quantity IN (partial/full)
- **Record waste** → `StockMovement` type `WASTE` + quantity OUT + alerts

PO statuses: `SUBMITTED` → `PARTIAL` → `RECEIVED` (or `CANCELLED`)

## Frontend (Inventory portal)

- Suppliers CRUD
- Purchases list + create PO + receive goods dialog
- Waste list + record dialog

## Seed

- Suppliers: Fresh Dairy Co., Arabica Beans Trading  
- Sample PO `PO-SEED-001` (milk) ready to receive  

## Try it

1. Login `inventory@smartoffice.local`  
2. Purchases → Receive `PO-SEED-001`  
3. Waste → record spoilage on an ingredient  
4. Check Stock / Movements / Alerts  
