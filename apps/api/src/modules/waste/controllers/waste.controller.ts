import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/auth.types';
import { WasteService } from '../services/waste.service';
import { CreateWasteDto, WasteQueryDto } from '../dto/waste.dto';

@ApiTags('Waste')
@ApiBearerAuth()
@Controller('waste')
export class WasteController {
  constructor(private readonly wasteService: WasteService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.WASTE_READ)
  @ApiOperation({ summary: 'List waste records' })
  findAll(@Query() query: WasteQueryDto) {
    return this.wasteService.findAll(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.WASTE_CREATE)
  @ApiOperation({ summary: 'Record waste and deduct stock' })
  create(
    @Body() dto: CreateWasteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.wasteService.create(dto, user.id);
  }
}
