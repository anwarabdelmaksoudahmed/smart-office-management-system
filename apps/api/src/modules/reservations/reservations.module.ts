import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module';
import { ReservationsController } from './controllers/reservations.controller';
import { ReservationsService } from './services/reservations.service';

@Module({
  imports: [RealtimeModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
