import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AcoService } from './aco.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health Plan & Outcomes (ACO)')
@Controller('v1/aco')
export class AcoController {
  constructor(private readonly acoService: AcoService) {}

  @Get('cohorts')
  @ApiOperation({ summary: 'List patient population cohorts' })
  async getCohorts() {
    return this.acoService.getCohorts();
  }

  @Post('cohorts')
  @ApiOperation({ summary: 'Define population health cohort' })
  async createCohort(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.acoService.createCohort(body, userId);
  }

  @Get('measures')
  @ApiOperation({ summary: 'List quality measures and benchmark rates' })
  async getMeasures() {
    return this.acoService.getMeasures();
  }

  @Post('measures')
  @ApiOperation({ summary: 'Create quality measure' })
  async createMeasure(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.acoService.createMeasure(body, userId);
  }

  @Get('outcomes')
  @ApiOperation({ summary: 'List evaluated health outcomes and readmissions' })
  async getOutcomes(@Query('patientId') patientId?: string) {
    return this.acoService.getOutcomes(patientId);
  }

  @Post('outcomes')
  @ApiOperation({ summary: 'Record outcome score' })
  async recordOutcome(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.acoService.recordOutcome(body, userId);
  }

  @Get('programs')
  @ApiOperation({ summary: 'List managed value-based care programs' })
  async getPrograms() {
    return this.acoService.getPrograms();
  }

  @Post('programs')
  @ApiOperation({ summary: 'Create value-based care program' })
  async createProgram(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.acoService.createProgram(body, userId);
  }
}
