# Phase 2 — Backend Bootstrap Guide

## What was built

- NestJS app with Helmet, CORS, ValidationPipe, Winston, Throttler
- JWT access + rotating refresh tokens (hashed in DB)
- Global `JwtAuthGuard` + `PermissionsGuard` (SUPER_ADMIN bypass)
- Modules: Auth, Users, Roles, Permissions, Health, Realtime stub
- Prisma client + initial migration
- Seed: 8 system roles, full permission catalog, demo users

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (Postgres 16 + Redis 7)

## Setup

```bash
cd "Smart Office Management System"
cp .env.example .env
cp .env.example apps/api/.env   # if not already present

pnpm install
pnpm build:shared
pnpm docker:up

# Wait for healthy containers, then:
pnpm db:generate
cd apps/api && pnpm exec prisma migrate deploy && cd ../..
pnpm db:seed

pnpm dev:api
```

- API: http://localhost:3000/api/v1  
- Swagger: http://localhost:3000/api/docs  
- Health: http://localhost:3000/api/v1/health  

## Demo users

Password for all: `Admin@12345`

| Email | Role |
|-------|------|
| superadmin@smartoffice.local | SUPER_ADMIN |
| admin@smartoffice.local | ADMIN |
| hr@smartoffice.local | HR |
| inventory@smartoffice.local | INVENTORY_MANAGER |
| barista@smartoffice.local | BARISTA |
| gaming@smartoffice.local | GAMING_SUPERVISOR |
| employee@smartoffice.local | EMPLOYEE |
| guest@smartoffice.local | GUEST |

## Smoke test

```bash
# Login
curl -s http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@smartoffice.local","password":"Admin@12345"}' | jq

# Use accessToken:
curl -s http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq

# Should succeed (admin has users.read):
curl -s http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" | jq

# Should fail 403 for employee:
# login as employee@smartoffice.local → GET /users → Forbidden
```

## Key files

| Path | Purpose |
|------|---------|
| `apps/api/src/main.ts` | Bootstrap, Swagger, Helmet |
| `apps/api/src/app.module.ts` | Global guards & modules |
| `apps/api/src/modules/auth/` | Login / refresh / logout |
| `apps/api/src/common/guards/` | JWT + Permissions |
| `apps/api/prisma/seed.ts` | Roles & demo data |
| `packages/shared/src/constants/` | Permission codes + role map |
