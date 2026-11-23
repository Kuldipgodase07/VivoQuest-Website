import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { VaccinationsService } from './vaccinations.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Adult Vaccination')
@Controller('v1/vaccinations')
export class VaccinationsController {
  constructor(private readonly vacService: VaccinationsService) {}

  @Get('schedules')
  @ApiOperation({ summary: 'List adult immunization schedules' })
  async getSchedules() {
    return this.vacService.getSchedules();
  }

  @Get()
  @ApiOperation({ summary: 'List patient vaccination records' })
  async getDoses(@Query('patientId') patientId: string) {
    return this.vacService.getPatientDoses(patientId);
  }

  @Post(':id/doses')
  @ApiOperation({ summary: 'Record administered dose' })
  async recordDose(
    @Param('id') scheduleId: string,
    @Body() body: any,
    @CurrentUser('id') userId: string
  ) {
    return this.vacService.recordDose(scheduleId, body, userId);
  }

  @Get(':id/certificate')
  @ApiOperation({ summary: 'Retrieve verifiable vaccination certificate with QR' })
  async getCertificate(@Param('id') identifier: string) {
    return this.vacService.getCertificate(identifier);
  }
}
