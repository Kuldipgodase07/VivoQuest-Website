import { Module } from '@nestjs/common';
import { AcoService } from './aco.service';
import { AcoController } from './aco.controller';

@Module({
  controllers: [AcoController],
  providers: [AcoService],
  exports: [AcoService]
})
export class AcoModule {}
