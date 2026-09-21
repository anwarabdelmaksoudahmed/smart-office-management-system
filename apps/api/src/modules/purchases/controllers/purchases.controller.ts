import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@smart-office/shared';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/auth.types';
import { PurchasesService } from '../services/purchases.service';
import {
  CreatePurchaseDto,
  PurchasesQueryDto,
  ReceivePurchaseDto,
} from '../dto/purchase.dto';

@ApiTags('Purchases')
@ApiBearerAuth()
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PURCHASES_READ)
  @ApiOperation({ summary: 'List purchase orders' })
  findAll(@Query() query: PurchasesQueryDto) {
    return this.purchasesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PURCHASES_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PURCHASES_CREATE)
  @ApiOperation({ summary: 'Create & submit purchase order' })
  create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.purchasesService.create(dto, user.id);
  }

  @Post(':id/receive')
  @RequirePermissions(PERMISSIONS.PURCHASES_RECEIVE)
  @ApiOperation({ summary: 'Receive goods — increases stock' })
  receive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReceivePurchaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.purchasesService.receive(id, dto, user.id);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.PURCHASES_UPDATE)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.cancel(id);
  }
}
