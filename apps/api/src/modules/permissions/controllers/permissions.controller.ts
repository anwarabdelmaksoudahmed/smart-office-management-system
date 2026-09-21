import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsService } from '../services/permissions.service';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class PermissionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  module?: string;
}

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS_READ)
  @ApiOperation({ summary: 'List all permissions' })
  findAll(@Query() query: PermissionsQueryDto) {
    if (query.module) {
      return this.permissionsService.findByModule(query.module);
    }
    return this.permissionsService.findAll();
  }
}
