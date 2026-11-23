import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, AuditService],
  exports: [ReportsService]
})
export class ReportsModule {}
