# Phase 10 — Admin dashboard, reports, audit, settings

## APIs

| Endpoint | Permission |
|----------|------------|
| `GET /dashboard/:portal` | `dashboard.*` (admin unlocks all) |
| `GET /reports/:type` | `reports.read` — `orders\|sales\|inventory\|gaming` |
| `GET/PATCH /settings` | `settings.read\|update` |
| `GET /audit-logs` | `audit.read` |
| Users / Roles / Permissions | existing Phase 2 APIs |

## Admin portal UI

- Dashboard KPIs + recent audit
- Users CRUD + role assignment
- Roles permission editor
- Reports (7/14/30 day lookback)
- Audit log browser
- Settings editor (JSON + numeric rewards helpers)

## Try it

1. Login `admin@smartoffice.local` / `Admin@12345`
2. Dashboard → KPIs refresh every 30s  
3. Reports → switch Orders / Sales / Inventory / Gaming  
4. Settings → change `rewards.points_per_order` → Save  
5. Audit → see `settings.update` + login events  
