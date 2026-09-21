import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/auth.types';
import { InventoryService } from '../services/inventory.service';
import {
  AdjustStockDto,
  MovementsQueryDto,
  StockQueryDto,
  UpdateStockMetaDto,
} from '../dto/inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: 'List stock items' })
  listStock(@Query() query: StockQueryDto) {
    return this.inventoryService.listStock(query);
  }

  @Get('stock/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  getStock(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.getStockItem(id);
  }

  @Post('adjust')
  @RequirePermissions(PERMISSIONS.INVENTORY_ADJUST)
  @ApiOperation({ summary: 'Adjust stock quantity (IN/OUT/ADJUSTMENT)' })
  adjust(
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.adjust(dto, user.id);
  }

  @Patch('stock/:id')
  @RequirePermissions(PERMISSIONS.INVENTORY_ADJUST)
  @ApiOperation({ summary: 'Update expiry / location metadata' })
  updateMeta(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockMetaDto,
  ) {
    return this.inventoryService.updateMeta(id, dto);
  }

  @Get('movements')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: 'Stock movement history' })
  movements(@Query() query: MovementsQueryDto) {
    return this.inventoryService.listMovements(query);
  }

  @Get('alerts')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: 'Low stock and expiry alerts' })
  alerts(@Query('expiringWithinDays') days?: string) {
    return this.inventoryService.getAlerts(
      days ? parseInt(days, 10) : 7,
    );
  }

  @Get('daily')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ, PERMISSIONS.DASHBOARD_INVENTORY)
  @ApiOperation({ summary: 'Daily inventory summary' })
  daily() {
    return this.inventoryService.dailySummary();
  }
}
