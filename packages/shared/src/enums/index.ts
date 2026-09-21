/**
 * Shared domain enums — single source of truth for API + Web.
 * Keep in sync with Prisma enums in apps/api/prisma/schema.prisma
 */

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COLLECTED = 'COLLECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

export enum OrderType {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED',
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
  PURCHASE = 'PURCHASE',
  RETURN = 'RETURN',
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PARTIAL = 'PARTIAL',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum GamingBookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum WaitingQueueStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  SEATED = 'SEATED',
  LEFT = 'LEFT',
  CANCELLED = 'CANCELLED',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum UnitOfMeasure {
  ML = 'ML',
  G = 'G',
  KG = 'KG',
  L = 'L',
  PCS = 'PCS',
  CUP = 'CUP',
}

export enum StockItemType {
  INGREDIENT = 'INGREDIENT',
  PRODUCT = 'PRODUCT',
}

export enum RewardTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  ADJUST = 'ADJUST',
  EXPIRE = 'EXPIRE',
}

export enum FreeDrinkTransactionType {
  GRANT = 'GRANT',
  REDEEM = 'REDEEM',
  ADJUST = 'ADJUST',
  EXPIRE = 'EXPIRE',
}

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  HR = 'HR',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  BARISTA = 'BARISTA',
  GAMING_SUPERVISOR = 'GAMING_SUPERVISOR',
  EMPLOYEE = 'EMPLOYEE',
  GUEST = 'GUEST',
}

/** Valid order status transitions (from → to[]) */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COLLECTED],
  [OrderStatus.COLLECTED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [OrderStatus.ARCHIVED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.ARCHIVED]: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}
