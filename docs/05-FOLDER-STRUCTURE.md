# Folder Structure

```
smart-office-cafe/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── prisma/
│   │   │   └── schema.prisma         # ✅ Production schema
│   │   ├── src/
│   │   │   ├── common/               # Guards, filters, interceptors, pipes
│   │   │   ├── config/
│   │   │   ├── health/
│   │   │   ├── realtime/             # Socket.io gateways
│   │   │   ├── prisma/               # PrismaService
│   │   │   ├── modules/              # Feature modules (1:1 domain)
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   ├── permissions/
│   │   │   │   ├── employees/
│   │   │   │   ├── orders/
│   │   │   │   ├── menu/
│   │   │   │   ├── categories/
│   │   │   │   ├── recipes/
│   │   │   │   ├── inventory/
│   │   │   │   ├── ingredients/
│   │   │   │   ├── suppliers/
│   │   │   │   ├── purchases/
│   │   │   │   ├── waste/
│   │   │   │   ├── gaming/
│   │   │   │   ├── reservations/
│   │   │   │   ├── notifications/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/
│   │   │   │   ├── audit-logs/
│   │   │   │   └── uploads/
│   │   │   ├── app.module.ts         # Phase 2
│   │   │   └── main.ts               # Phase 2
│   │   └── package.json
│   └── web/                          # Vue 3 SPA (5 portals)
│       ├── public/
│       └── src/
│           ├── app/
│           ├── assets/
│           ├── i18n/locales/         # en.json, ar.json
│           ├── modules/              # Mirrors backend features
│           ├── shared/
│           │   ├── components/
│           │   │   ├── ui/
│           │   │   ├── layout/       # employee|barista|inventory|gaming|admin
│           │   │   ├── forms/
│           │   │   ├── tables/
│           │   │   └── dialogs/
│           │   ├── composables/
│           │   ├── services/
│           │   └── stores/
│           ├── router/
│           └── plugins/
├── packages/
│   ├── shared/                       # ✅ Enums, permissions, transitions
│   └── config/                       # Shared ESLint/TS configs (Phase 2)
├── docker/
│   └── docker-compose.yml            # ✅ Postgres + Redis
├── docs/
│   ├── 01-REQUIREMENTS-ANALYSIS.md   # ✅
│   ├── 02-SYSTEM-ARCHITECTURE.md     # ✅
│   ├── 03-DATABASE-ERD.md            # ✅
│   └── api/
│       └── 04-API-CONTRACT.md        # ✅
├── scripts/
│   └── init-db.sql                   # ✅ citext, uuid, pg_trgm
├── .github/workflows/                # CI/CD Phase 13
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Why this layout

1. **Monorepo** — shared enums/permissions stay in sync across API and Web  
2. **Feature modules** — each domain owns its controllers/services/DTOs  
3. **Mirrored frontend modules** — reduces cognitive load for 20+ domains  
4. **Shared UI kit** — tables/forms/dialogs reused across 5 portals  
5. **Docker infra first** — local Postgres/Redis match production topology  
