import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { FastifyReply } from 'fastify';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Request server-side PDF or Excel report job' })
  async createReport(
    @Body() body: { reportType: string; format: 'pdf' | 'xlsx'; filters?: any },
    @CurrentUser('id') userId: string
  ) {
    return this.reportsService.createJob({
      reportType: body.reportType,
      format: body.format,
      filters: body.filters,
      requestedBy: userId
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report job status' })
  async getJob(@Param('id') id: string) {
    return this.reportsService.getJob(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download generated PDF or Excel report file' })
  async downloadReport(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Res() reply: FastifyReply
  ) {
    const { buffer, mime, filename } = await this.reportsService.downloadReport(id, userId);

    reply
      .header('Content-Type', mime)
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Content-Length', buffer.length)
      .send(Buffer.from(buffer));
  }
}
