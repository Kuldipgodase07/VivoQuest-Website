import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, AuditService],
  exports: [ComplianceService]
})
export class ComplianceModule {}
