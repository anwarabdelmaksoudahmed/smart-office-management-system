import { Global, Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { AuditLogsController } from './controllers/audit-logs.controller';

@Global()
@Module({
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditLogsModule {}
