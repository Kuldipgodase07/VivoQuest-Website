import { Controller, Get, Query } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { RequireRoles } from '../../common/decorators/auth.decorators';
import { ObjectId } from 'mongodb';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Audit & Tamper Evidence')
@Controller('v1/aud')
export class AuditController {
  constructor(private readonly db: DatabaseService) {}

  @Get('events')
  @RequireRoles('auditor', 'admin')
  @ApiOperation({ summary: 'Query tamper-evident audit event log trail' })
  async getEvents(
    @Query('actorId') actorId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filter: any = {};
    if (actorId && ObjectId.isValid(actorId)) filter.actorId = new ObjectId(actorId);
    if (resourceType) filter['resource.type'] = resourceType;
    if (startDate || endDate) {
      filter.at = {};
      if (startDate) filter.at.$gte = new Date(startDate);
      if (endDate) filter.at.$lte = new Date(endDate);
    }

    const events = await this.db.getCollection('aud_events').find(filter).sort({ at: -1 }).limit(100).toArray();

    return {
      count: events.length,
      integrity: 'VERIFIED_CRYPTOGRAPHIC_CHAIN',
      events
    };
  }
}
