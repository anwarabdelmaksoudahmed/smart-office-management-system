import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@smart-office/shared';

export const PERMISSIONS_KEY = 'permissions';

/** Require ANY of the listed permissions (OR). Use PermissionsGuard(AND) for all. */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
