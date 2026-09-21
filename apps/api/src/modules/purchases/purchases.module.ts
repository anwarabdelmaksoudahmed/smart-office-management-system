import { Module } from '@nestjs/common';
import { PurchasesController } from './controllers/purchases.controller';
import { PurchasesService } from './services/purchases.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
