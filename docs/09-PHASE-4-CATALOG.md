# Phase 4 — Catalog (Categories, Menu, Recipes)

## Backend APIs

| Resource | Endpoints |
|----------|-----------|
| Categories | `GET/POST /categories`, `GET/PATCH/DELETE /categories/:id` |
| Menu | `GET/POST /menu`, `GET/PATCH/DELETE /menu/:id`, favorites |
| Recipes | `GET /recipes`, `GET /recipes/by-menu/:id`, `PUT /recipes/:menuItemId` |
| Ingredients | `GET/POST /ingredients`, `GET/PATCH/DELETE /ingredients/:id` (needed for recipes) |

Recipe upsert replaces all lines and increments `version` — prepares inventory automation (Phase 6).

## Seed catalog

- 5 ingredients with stock
- 3 categories (hot / cold / snacks)
- 4 menu items (Latte, Espresso, Americano, Iced Mocha)
- Recipes with ingredient lines (Latte = 250ml milk + 18g coffee + 5g sugar)

## Frontend

| Portal | Pages |
|--------|-------|
| Employee | Browse menu + favorites |
| Admin | Categories, Menu CRUD, Recipes editor |
| Inventory | Recipes editor |

## Permissions

Uses existing RBAC codes: `categories.*`, `menu.*`, `recipes.*`, `ingredients.*`.
