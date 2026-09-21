import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { ReportsService } from '../services/reports.service';
import { ReportsQueryDto } from '../../audit-logs/dto/audit.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':type')
  @RequirePermissions(PERMISSIONS.REPORTS_READ)
  @ApiOperation({
    summary: 'Operational reports (orders|inventory|gaming|sales)',
  })
  get(@Param('type') type: string, @Query() query: ReportsQueryDto) {
    return this.reportsService.get(type, query);
  }
}
