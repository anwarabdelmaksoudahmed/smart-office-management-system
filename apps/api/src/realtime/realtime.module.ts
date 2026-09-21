import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { OrdersGateway } from './orders.gateway';
import { InventoryGateway } from './inventory.gateway';
import { GamingGateway } from './gaming.gateway';

@Module({
  providers: [
    NotificationsGateway,
    OrdersGateway,
    InventoryGateway,
    GamingGateway,
  ],
  exports: [
    NotificationsGateway,
    OrdersGateway,
    InventoryGateway,
    GamingGateway,
  ],
})
export class RealtimeModule {}
