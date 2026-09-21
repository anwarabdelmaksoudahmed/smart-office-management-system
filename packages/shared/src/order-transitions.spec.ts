import { describe, expect, it } from 'vitest';
import {
  OrderStatus,
  SystemRole,
  canTransitionOrder,
  ORDER_TRANSITIONS,
} from './enums/index.js';
import {
  ROLE_PERMISSION_MAP,
  ALL_PERMISSION_CODES,
} from './constants/role-permissions.js';
import { PERMISSIONS } from './constants/permissions.js';

describe('canTransitionOrder', () => {
  it('allows the happy-path café lifecycle', () => {
    const path: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.COLLECTED,
      OrderStatus.COMPLETED,
      OrderStatus.ARCHIVED,
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransitionOrder(path[i], path[i + 1])).toBe(true);
    }
  });

  it('rejects illegal jumps', () => {
    expect(canTransitionOrder(OrderStatus.PENDING, OrderStatus.READY)).toBe(
      false,
    );
    expect(
      canTransitionOrder(OrderStatus.COMPLETED, OrderStatus.PENDING),
    ).toBe(false);
  });

  it('covers every status key in ORDER_TRANSITIONS', () => {
    for (const status of Object.values(OrderStatus)) {
      expect(ORDER_TRANSITIONS[status]).toBeDefined();
    }
  });
});

describe('ROLE_PERMISSION_MAP', () => {
  it('gives SUPER_ADMIN wildcard access', () => {
    expect(ROLE_PERMISSION_MAP[SystemRole.SUPER_ADMIN]).toBe('*');
  });

  it('gives employees order + reservation self-service', () => {
    const perms = ROLE_PERMISSION_MAP[SystemRole.EMPLOYEE];
    expect(Array.isArray(perms)).toBe(true);
    expect(perms).toContain(PERMISSIONS.ORDERS_CREATE);
    expect(perms).toContain(PERMISSIONS.RESERVATIONS_CREATE);
    expect(perms).not.toContain(PERMISSIONS.ORDERS_QUEUE);
  });

  it('gives baristas queue permissions', () => {
    const perms = ROLE_PERMISSION_MAP[SystemRole.BARISTA] as string[];
    expect(perms).toContain(PERMISSIONS.ORDERS_QUEUE);
    expect(perms).toContain(PERMISSIONS.ORDERS_PREPARE);
  });

  it('exports a non-empty permission catalog', () => {
    expect(ALL_PERMISSION_CODES.length).toBeGreaterThan(20);
    expect(ALL_PERMISSION_CODES).toContain(PERMISSIONS.AUDIT_READ);
  });
});
