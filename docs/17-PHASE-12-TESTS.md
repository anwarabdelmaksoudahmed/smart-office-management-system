# Phase 12 — Unit & E2E tests

Critical-path coverage across shared, API, and web packages.

## Commands

| Command | What runs |
|---------|-----------|
| `pnpm test` | All workspace unit tests |
| `pnpm --filter @smart-office/shared test` | Vitest — order transitions |
| `pnpm --filter @smart-office/api test` | Jest — guards, pagination, rewards |
| `pnpm --filter @smart-office/web test` | Vitest — cart store, PageHeader |
| `pnpm test:e2e` | API optional smoke + Playwright login |
| `pnpm --filter @smart-office/web test:e2e` | Playwright (starts Vite on `:5173`) |

First-time Playwright: `pnpm --filter @smart-office/web exec playwright install chromium`

## Shared (`packages/shared`)

| Spec | Covers |
|------|--------|
| `order-transitions.spec.ts` | Allowed status graph (Pending → … → Archived, rejects) |

## API (`apps/api`)

| Spec | Covers |
|------|--------|
| `permissions.guard.spec.ts` | Missing perms → 403; match → allow |
| `pagination.dto.spec.ts` | `paginate()` shape + defaults |
| `rewards.service.spec.ts` | Redeem math, defaults, ledger |
| `test/app.e2e-spec.ts` | Live `/health` + unauth `/orders` (skips if API down) |

## Web (`apps/web`)

| Spec | Covers |
|------|--------|
| `cart.store.spec.ts` | Add / qty / clear / totals |
| `PageHeader.spec.ts` | Title + slot render |
| `e2e/login.spec.ts` | Login brand + required password |

## Notes

- Spec files are excluded from app `tsconfig` so they do not ship in builds.
- API e2e is smoke-only and does not require a running DB when the server is offline.
- Playwright uses Chromium only; `reuseExistingServer` is on outside CI.

## Next

**Phase 13 — Dockerfiles + CI/CD**
