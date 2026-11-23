import { Module } from '@nestjs/common';
import { IamService } from './iam.service';
import { AuthController } from './auth.controller';
import { MeController } from './me.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [AuthController, MeController],
  providers: [IamService, AuditService],
  exports: [IamService]
})
export class IamModule {}
