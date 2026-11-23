import { Controller, Get, Put, Post, Param, Body } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Profiles')
@Controller('v1')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('patients/:id')
  @ApiOperation({ summary: 'Get patient profile' })
  async getPatient(@Param('id') id: string) {
    return this.profilesService.getPatient(id);
  }

  @Put('patients/:id')
  @ApiOperation({ summary: 'Update patient profile' })
  async updatePatient(@Param('id') id: string, @Body() body: any) {
    return this.profilesService.updatePatient(id, body);
  }

  @Get('caregivers/:id')
  @ApiOperation({ summary: 'Get caregiver profile' })
  async getCaregiver(@Param('id') id: string) {
    return this.profilesService.getCaregiver(id);
  }

  @Put('caregivers/:id')
  @ApiOperation({ summary: 'Update caregiver profile' })
  async updateCaregiver(@Param('id') id: string, @Body() body: any) {
    return this.profilesService.updateCaregiver(id, body);
  }

  @Get('nurses/:id')
  @ApiOperation({ summary: 'Get nurse profile' })
  async getNurse(@Param('id') id: string) {
    return this.profilesService.getNurse(id);
  }

  @Put('nurses/:id')
  @ApiOperation({ summary: 'Update nurse profile' })
  async updateNurse(@Param('id') id: string, @Body() body: any) {
    return this.profilesService.updateNurse(id, body);
  }

  @Get('clinicians/:id')
  @ApiOperation({ summary: 'Get clinician profile' })
  async getClinician(@Param('id') id: string) {
    return this.profilesService.getClinician(id);
  }

  @Put('clinicians/:id')
  @ApiOperation({ summary: 'Update clinician profile' })
  async updateClinician(@Param('id') id: string, @Body() body: any) {
    return this.profilesService.updateClinician(id, body);
  }

  @Post('care-relationships')
  @ApiOperation({ summary: 'Bind care relationship between patient and caregiver/clinician' })
  async createCareRelationship(@Body() body: any) {
    return this.profilesService.createCareRelationship(body);
  }
}
