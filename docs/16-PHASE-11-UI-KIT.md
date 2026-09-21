# Phase 11 — Reusable UI kit polish

Shared presentation layer for all five portals.

## Design tokens (`main.css`)

| Token / class | Use |
|---------------|-----|
| `--soc-*` | Brand colors, surfaces, danger/warn/success |
| `.soc-page` / `.soc-title` / `.soc-surface` | Page chrome |
| `.soc-hero` / `.soc-label` / `.soc-kpi` | Dashboard density |
| `.soc-toolbar` / `.soc-empty` | Tables & empty states |
| `.soc-page-enter` / `.soc-stagger` | Subtle motion (respects `prefers-reduced-motion`) |

## Kit components (`@/shared/components/ui`)

| Component | Role |
|-----------|------|
| `PageHeader` | Title + blurb + actions |
| `PageHero` | Portal greeting / atmosphere banner |
| `KpiCard` | Metric tiles (tones: brand/warn/danger/success) |
| `SectionCard` | Bordered section with optional header |
| `DataToolbar` | Search + trailing actions |
| `EmptyState` | Centered empty / placeholder |
| `StatusTag` | Consistent status chips |
| `PortalDashboard` | Default portal landing (uses hero + KPIs) |

Import: `import { PageHeader, KpiCard } from '@/shared/components/ui'`

## Applied

- All portal dashboards (Employee, Barista, Inventory, Gaming, Admin) on live KPIs where APIs exist
- Cart empty state, Rewards, Suppliers as reference list/detail patterns
- AppShell content enter animation

## Next

**Phase 12 — Tests** (unit + e2e) — see [17-PHASE-12-TESTS.md](17-PHASE-12-TESTS.md).
