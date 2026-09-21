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
import { OrdersService } from '../services/orders.service';
import {
  CreateOrderDto,
  OrdersQueryDto,
  RateOrderDto,
  RejectOrderDto,
} from '../dto/order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ORDERS_CREATE)
  @ApiOperation({ summary: 'Place a new order' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_QUEUE)
  @ApiOperation({ summary: 'List orders (own or all if queue permission)' })
  findAll(
    @Query() query: OrdersQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findAll(query, {
      id: user.id,
      permissions: user.permissions,
    });
  }

  @Get('queue')
  @RequirePermissions(PERMISSIONS.ORDERS_QUEUE)
  @ApiOperation({ summary: 'Barista live queue' })
  queue() {
    return this.ordersService.queue();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_QUEUE)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findOne(id, {
      id: user.id,
      permissions: user.permissions,
    });
  }

  @Post(':id/accept')
  @RequirePermissions(PERMISSIONS.ORDERS_ACCEPT)
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.accept(id, user.id);
  }

  @Post(':id/claim')
  @RequirePermissions(PERMISSIONS.ORDERS_QUEUE)
  @ApiOperation({ summary: 'Claim order for multi-barista queue' })
  claim(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.claim(id, user.id);
  }

  @Post(':id/release')
  @RequirePermissions(PERMISSIONS.ORDERS_QUEUE)
  @ApiOperation({ summary: 'Release claimed order back to the shared queue' })
  release(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.release(id, user.id);
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.ORDERS_REJECT)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectOrderDto,
  ) {
    return this.ordersService.reject(id, user.id, dto);
  }

  @Post(':id/prepare')
  @RequirePermissions(PERMISSIONS.ORDERS_PREPARE)
  prepare(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.prepare(id, user.id);
  }

  @Post(':id/ready')
  @RequirePermissions(PERMISSIONS.ORDERS_READY)
  ready(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.ready(id, user.id);
  }

  @Post(':id/collect')
  @RequirePermissions(PERMISSIONS.ORDERS_COLLECT)
  collect(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.collect(id, user.id);
  }

  @Post(':id/complete')
  @RequirePermissions(PERMISSIONS.ORDERS_COMPLETE)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.complete(id, user.id);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.ORDERS_CANCEL, PERMISSIONS.ORDERS_QUEUE)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.cancel(id, {
      id: user.id,
      permissions: user.permissions,
    });
  }

  @Post(':id/rate')
  @RequirePermissions(PERMISSIONS.ORDERS_READ)
  rate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RateOrderDto,
  ) {
    return this.ordersService.rate(id, user.id, dto);
  }

  @Post(':id/repeat')
  @RequirePermissions(PERMISSIONS.ORDERS_CREATE)
  repeat(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.repeat(id, user.id);
  }

  @Get(':id/ticket')
  @RequirePermissions(PERMISSIONS.ORDERS_PRINT)
  ticket(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.ticket(id, {
      id: user.id,
      permissions: user.permissions,
    });
  }
}
