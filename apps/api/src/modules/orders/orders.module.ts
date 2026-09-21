import { Module } from '@nestjs/common';
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './services/orders.service';
import { RealtimeModule } from '../../realtime/realtime.module';
import { InventoryModule } from '../inventory/inventory.module';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [RealtimeModule, InventoryModule, EmployeesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
