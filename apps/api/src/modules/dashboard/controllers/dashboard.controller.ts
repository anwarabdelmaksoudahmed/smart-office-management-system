import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/auth.types';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':portal')
  @RequirePermissions(
    PERMISSIONS.DASHBOARD_ADMIN,
    PERMISSIONS.DASHBOARD_BARISTA,
    PERMISSIONS.DASHBOARD_INVENTORY,
    PERMISSIONS.DASHBOARD_GAMING,
  )
  @ApiOperation({ summary: 'Portal KPI dashboard' })
  get(
    @Param('portal') portal: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dashboardService.getPortal(portal, {
      permissions: user.permissions,
    });
  }
}
