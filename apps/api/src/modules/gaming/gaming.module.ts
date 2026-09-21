import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { RoomsController } from './controllers/rooms.controller';
import { DevicesController } from './controllers/devices.controller';
import { AvailabilityController } from './controllers/availability.controller';
import { QueueController } from './controllers/queue.controller';
import { RoomsService } from './services/rooms.service';
import { DevicesService } from './services/devices.service';
import { AvailabilityService } from './services/availability.service';
import { QueueService } from './services/queue.service';

@Module({
  imports: [RealtimeModule, ReservationsModule],
  controllers: [
    RoomsController,
    DevicesController,
    AvailabilityController,
    QueueController,
  ],
  providers: [RoomsService, DevicesService, AvailabilityService, QueueService],
})
export class GamingModule {}
