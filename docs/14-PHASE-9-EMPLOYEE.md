# Phase 9 — Employee portal polish

Cart & favorites already shipped in Phases 4–5. This phase adds **rewards**, **free drinks**, and **ratings earn**.

## APIs

| Endpoint | Purpose |
|----------|---------|
| `GET /employees/me` | Profile + balances |
| `GET /employees/me/balance` | Points, free drinks, recent ledger |
| `POST /employees/me/rewards/redeem` | Points → free drink(s) |
| `GET/PATCH /employees` | HR list/update (existing permissions) |
| `POST /orders` + `useFreeDrink` | Checkout with free drink credit |
| `POST /orders/:id/rate` | Rating (+ bonus points) |

## Earn / redeem rules (settings)

| Key | Default |
|-----|---------|
| `rewards.points_per_order` | 10 (on COMPLETED) |
| `rewards.points_per_rating` | 5 |
| `rewards.points_per_free_drink` | 50 |

Free drink at checkout discounts the **highest unit-priced** line item.

## Frontend

- `/employee/rewards` — balances, redeem, history
- Dashboard widgets for points / free drinks
- Cart checkbox “Use a free drink”
- Orders history shows rating stars + free-drink tag

## Seed

Demo users already get **100 points** + **5 free drinks**.

## Try it

1. `employee@smartoffice.local` → Rewards → redeem 50 pts  
2. Menu → Cart → enable free drink → place order  
3. After barista completes → rate order → earn +5 pts  
