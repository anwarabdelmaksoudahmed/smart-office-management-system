import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { AuditService } from '../services/audit.service';
import { AuditLogsQueryDto } from '../dto/audit.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  @ApiOperation({ summary: 'List audit logs' })
  findAll(@Query() query: AuditLogsQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
