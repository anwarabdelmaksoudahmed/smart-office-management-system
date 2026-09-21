import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '@smart-office/shared';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

function createContext(user?: {
  id: string;
  roles: string[];
  permissions: string[];
}): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('allows when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows SUPER_ADMIN regardless of permission list', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['orders.queue']);
    expect(
      guard.canActivate(
        createContext({
          id: '1',
          roles: [SystemRole.SUPER_ADMIN],
          permissions: [],
        }),
      ),
    ).toBe(true);
  });

  it('allows when user has any required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['orders.read', 'orders.queue']);
    expect(
      guard.canActivate(
        createContext({
          id: '1',
          roles: [SystemRole.EMPLOYEE],
          permissions: ['orders.read'],
        }),
      ),
    ).toBe(true);
  });

  it('rejects when user lacks required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['orders.queue']);
    expect(() =>
      guard.canActivate(
        createContext({
          id: '1',
          roles: [SystemRole.EMPLOYEE],
          permissions: ['orders.read'],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects when authenticated user is missing', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['users.read']);
    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });

  it('reads PERMISSIONS_KEY via reflector', () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([]);
    guard.canActivate(createContext({ id: '1', roles: [], permissions: [] }));
    expect(spy).toHaveBeenCalledWith(PERMISSIONS_KEY, expect.any(Array));
  });
});
