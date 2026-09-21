import { Module } from '@nestjs/common';
import { WasteController } from './controllers/waste.controller';
import { WasteService } from './services/waste.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [WasteController],
  providers: [WasteService],
  exports: [WasteService],
})
export class WasteModule {}
