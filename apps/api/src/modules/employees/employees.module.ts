import { Module } from '@nestjs/common';
import { EmployeesController } from './controllers/employees.controller';
import { EmployeesService } from './services/employees.service';
import { RewardsService } from './services/rewards.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, RewardsService],
  exports: [EmployeesService, RewardsService],
})
export class EmployeesModule {}
