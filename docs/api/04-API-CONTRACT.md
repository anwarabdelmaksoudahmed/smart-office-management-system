# REST API Contract (v1)

Base URL: `/api/v1`  
Auth: `Authorization: Bearer <access_token>`  
Refresh: `POST /api/v1/auth/refresh` (body or HttpOnly cookie)  
Docs: Swagger UI at `/api/docs`

## Conventions

| Concern | Standard |
|---------|----------|
| Versioning | URL prefix `/api/v1` |
| Pagination | `?page=1&limit=20` → `{ data, meta: { page, limit, total, totalPages } }` |
| Filtering | `?status=PENDING&categoryId=` |
| Sorting | `?sortBy=createdAt&sortOrder=desc` |
| Searching | `?search=latte` |
| Errors | `{ statusCode, message, error, details?, requestId }` |
| IDs | UUID |

## Auth

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/auth/login` | public | Email/password → tokens |
| POST | `/auth/refresh` | public | Rotate refresh token |
| POST | `/auth/logout` | auth | Revoke refresh token |
| GET | `/auth/me` | auth | Current user + roles + permissions |

## Users / Roles / Permissions

| Method | Path | Permission |
|--------|------|------------|
| GET | `/users` | `users.read` |
| POST | `/users` | `users.create` |
| GET | `/users/:id` | `users.read` |
| PATCH | `/users/:id` | `users.update` |
| DELETE | `/users/:id` | `users.delete` |
| GET | `/roles` | `roles.read` |
| POST | `/roles` | `roles.create` |
| PATCH | `/roles/:id` | `roles.update` |
| PUT | `/roles/:id/permissions` | `roles.assign_permissions` |
| GET | `/permissions` | `permissions.read` |

## Employees

| Method | Path | Permission |
|--------|------|------------|
| GET | `/employees` | `employees.read` |
| POST | `/employees` | `employees.create` |
| GET | `/employees/:id` | `employees.read` |
| PATCH | `/employees/:id` | `employees.update` |
| GET | `/employees/me/balance` | auth | Free drink + rewards |
| POST | `/employees/me/rewards/redeem` | auth |

## Categories / Menu / Recipes

| Method | Path | Permission |
|--------|------|------------|
| GET | `/categories` | public/auth |
| CRUD | `/categories` | `categories.*` |
| GET | `/menu` | auth |
| GET | `/menu/:id` | auth |
| CRUD | `/menu` | `menu.*` |
| POST | `/menu/:id/favorite` | auth |
| DELETE | `/menu/:id/favorite` | auth |
| GET | `/recipes` | `recipes.read` |
| PUT | `/recipes/:menuItemId` | `recipes.update` |

## Orders

| Method | Path | Permission |
|--------|------|------------|
| POST | `/orders` | `orders.create` |
| GET | `/orders` | `orders.read` / own |
| GET | `/orders/queue` | `orders.queue` |
| GET | `/orders/:id` | `orders.read` / own |
| POST | `/orders/:id/accept` | `orders.accept` |
| POST | `/orders/:id/reject` | `orders.reject` |
| POST | `/orders/:id/prepare` | `orders.prepare` |
| POST | `/orders/:id/ready` | `orders.ready` |
| POST | `/orders/:id/collect` | `orders.collect` |
| POST | `/orders/:id/complete` | `orders.complete` |
| POST | `/orders/:id/cancel` | `orders.cancel` / own |
| POST | `/orders/:id/rate` | auth (own completed) |
| POST | `/orders/:id/repeat` | auth |
| GET | `/orders/:id/ticket` | `orders.print` |

### Order transition rules

```
PENDING → ACCEPTED | REJECTED | CANCELLED
ACCEPTED → PREPARING | CANCELLED
PREPARING → READY
READY → COLLECTED
COLLECTED → COMPLETED
COMPLETED → ARCHIVED
```

## Inventory / Ingredients / Purchases / Waste

| Method | Path | Permission |
|--------|------|------------|
| CRUD | `/ingredients` | `ingredients.*` |
| CRUD | `/products` | `products.*` |
| GET | `/inventory/stock` | `inventory.read` |
| POST | `/inventory/adjust` | `inventory.adjust` |
| GET | `/inventory/movements` | `inventory.read` |
| GET | `/inventory/alerts` | `inventory.read` |
| CRUD | `/suppliers` | `suppliers.*` |
| CRUD | `/purchases` | `purchases.*` |
| POST | `/purchases/:id/receive` | `purchases.receive` |
| CRUD | `/waste` | `waste.*` |

## Gaming / Reservations

| Method | Path | Permission |
|--------|------|------------|
| CRUD | `/gaming/rooms` | `gaming.rooms.*` |
| CRUD | `/gaming/devices` | `gaming.devices.*` |
| GET | `/gaming/availability` | auth |
| POST | `/reservations` | `reservations.create` |
| GET | `/reservations` | own / `reservations.read` |
| POST | `/reservations/:id/cancel` | own / `reservations.cancel` |
| POST | `/reservations/:id/start` | `reservations.manage` |
| POST | `/reservations/:id/extend` | `reservations.manage` |
| GET | `/gaming/queue` | auth / `gaming.queue` |
| POST | `/gaming/queue` | auth |
| POST | `/gaming/queue/:id/seat` | `gaming.queue.manage` |

## Notifications / Dashboard / Reports / Settings / Audit / Uploads

| Method | Path | Permission |
|--------|------|------------|
| GET | `/notifications` | auth |
| PATCH | `/notifications/:id/read` | auth |
| POST | `/notifications/read-all` | auth |
| GET | `/dashboard/:portal` | portal-specific |
| GET | `/reports/:type` | `reports.read` |
| GET/PATCH | `/settings` | `settings.*` |
| GET | `/audit-logs` | `audit.read` |
| POST | `/uploads` | auth |
| GET | `/health` | public |

## Socket Events

| Namespace | Event | Payload (summary) |
|-----------|-------|-------------------|
| `/orders` | `order.created` | order summary |
| `/orders` | `order.updated` | id, status, timestamps |
| `/orders` | `order.ready` | id, number, userId |
| `/inventory` | `inventory.alert` | stockItemId, quantity, reorderLevel |
| `/gaming` | `reservation.updated` | booking |
| `/gaming` | `queue.updated` | roomId, entries |
| `/notifications` | `notification.new` | notification |

## Permission Code Catalog (seed)

```
users.read|create|update|delete
roles.read|create|update|assign_permissions
permissions.read
employees.read|create|update
categories.read|create|update|delete
menu.read|create|update|delete
recipes.read|update
orders.create|read|queue|accept|reject|prepare|ready|collect|complete|cancel|print
ingredients.read|create|update|delete
products.read|create|update|delete
inventory.read|adjust
suppliers.read|create|update|delete
purchases.read|create|update|receive
waste.read|create
gaming.rooms.read|create|update
gaming.devices.read|create|update
gaming.queue|gaming.queue.manage
reservations.create|read|cancel|manage
notifications.manage
dashboard.admin|barista|inventory|gaming
reports.read
settings.read|update
audit.read
```

### Default role → permission mapping

| Role | Access |
|------|--------|
| SUPER_ADMIN | `*` |
| ADMIN | all except system role mutation |
| HR | employees.*, users.read/create/update |
| INVENTORY_MANAGER | inventory.*, ingredients.*, products.*, purchases.*, suppliers.*, waste.*, recipes.* |
| BARISTA | orders.queue|accept|reject|prepare|ready|collect|complete|print, menu.read |
| GAMING_SUPERVISOR | gaming.*, reservations.* |
| EMPLOYEE | orders.create|read|cancel (own), menu.read, reservations.create|read|cancel (own) |
| GUEST | menu.read (limited), orders.create (if enabled) |
