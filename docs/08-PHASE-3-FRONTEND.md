# Phase 3 — Frontend Bootstrap

## Stack

Vue 3 · Composition API · TypeScript · Vite · Pinia · Vue Router · VueUse · Axios · TanStack Query · PrimeVue 4 · Tailwind · Vue I18n · VeeValidate · Yup

## Portals

| Path | Layout | Roles |
|------|--------|-------|
| `/employee/*` | EmployeeLayout | Employee, Guest, + ops roles |
| `/barista/*` | BaristaLayout | Barista, Admin, Super Admin |
| `/inventory/*` | InventoryLayout | Inventory Manager, Admin, Super Admin |
| `/gaming/*` | GamingLayout | Gaming Supervisor, Admin, Super Admin |
| `/admin/*` | AdminLayout | Super Admin, Admin, HR |

## Features delivered

- Login with VeeValidate + Yup
- JWT session (access + refresh) with axios interceptors
- Route guards (auth + role)
- Portal switcher for multi-role users
- EN / AR with RTL / LTR (`document.dir`)
- Light / Dark / System theme (`html.dark`)
- Shared `AppShell` + five portal layouts
- Dashboard shells + Coming Soon placeholders for nav items
- Brand theme: teal / slate (PrimeVue Aura preset), DM Sans + IBM Plex Sans / Arabic

## Run

```bash
pnpm install
pnpm build:shared
pnpm --filter @smart-office/web dev
```

App: http://localhost:5173  
API proxy: `/api` → `http://localhost:3000`

Login requires Phase 2 API running with seeded users (`Admin@12345`).

## Key paths

| Path | Purpose |
|------|---------|
| `apps/web/src/main.ts` | App bootstrap |
| `apps/web/src/router/index.ts` | Routes + guards |
| `apps/web/src/modules/auth/` | Login + auth store |
| `apps/web/src/shared/components/layout/` | Portal shells |
| `apps/web/src/i18n/locales/` | en.json / ar.json |
| `apps/web/src/shared/composables/useTheme.ts` | Theme |
