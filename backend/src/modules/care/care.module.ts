import { Module } from '@nestjs/common';
import { CareService } from './care.service';
import { CareController } from './care.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [CareController],
  providers: [CareService, AuditService],
  exports: [CareService]
})
export class CareModule {}
