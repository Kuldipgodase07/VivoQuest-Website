import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query
} from '@nestjs/common';
import { CareService } from './care.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Care Delivery')
@Controller('v1')
export class CareController {
  constructor(private readonly careService: CareService) {}

  // Appointments
  @Get('appointments')
  @ApiOperation({ summary: 'List care appointments' })
  async getAppointments(@Query('patientId') patientId?: string) {
    return this.careService.getAppointments(patientId);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Create appointment' })
  async createAppointment(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createAppointment(body, userId);
  }

  @Get('patients/:id/appointments')
  @ApiOperation({ summary: 'List patient appointments' })
  async getPatientAppointments(@Param('id') patientId: string) {
    return this.careService.getAppointments(patientId);
  }

  @Post('patients/:id/appointments')
  @ApiOperation({ summary: 'Create appointment for patient' })
  async createPatientAppointment(@Param('id') patientId: string, @Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createAppointment({ ...body, patientId }, userId);
  }

  // Visits
  @Get('visits')
  @ApiOperation({ summary: 'List visits' })
  async getVisits(@Query('caregiverId') caregiverId?: string) {
    return this.careService.getVisits(caregiverId);
  }

  @Post('visits')
  @ApiOperation({ summary: 'Schedule a home care visit' })
  async createVisit(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createVisit(body, userId);
  }

  @Get('caregivers/:id/visits')
  @ApiOperation({ summary: 'List caregiver visits' })
  async getCaregiverVisits(@Param('id') caregiverId: string) {
    return this.careService.getVisits(caregiverId);
  }

  @Post('visits/:id/notes')
  @ApiOperation({ summary: 'Add clinical notes to a visit' })
  async addVisitNote(@Param('id') visitId: string, @Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.addVisitNote(visitId, body, userId);
  }

  // Tasks
  @Get('tasks')
  @ApiOperation({ summary: 'List daily care tasks' })
  async getTasks(@Query('patientId') patientId?: string) {
    return this.careService.getTasks(patientId);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create care task' })
  async createTask(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createTask(body, userId);
  }

  // Medications
  @Get('medications')
  @ApiOperation({ summary: 'List medications' })
  async getMedications(@Query('patientId') patientId?: string) {
    return this.careService.getMedications(patientId);
  }

  @Post('medications')
  @ApiOperation({ summary: 'Add active medication' })
  async createMedication(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createMedication(body, userId);
  }

  // Vitals
  @Get('vitals')
  @ApiOperation({ summary: 'List vitals time-series' })
  async getVitals(@Query('patientId') patientId?: string) {
    return this.careService.getVitals(patientId);
  }

  @Post('vitals')
  @ApiOperation({ summary: 'Record physiological vital' })
  async recordVital(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.recordVital(body, userId);
  }

  @Get('nurse/vitals')
  @ApiOperation({ summary: 'Nurse vitals queue' })
  async getNurseVitals(@Query('patientId') patientId?: string) {
    return this.careService.getVitals(patientId);
  }

  @Post('nurse/vitals')
  @ApiOperation({ summary: 'Nurse submit vitals' })
  async recordNurseVital(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.recordVital(body, userId);
  }

  // Records
  @Get('records')
  @ApiOperation({ summary: 'List medical records' })
  async getRecords(@Query('patientId') patientId?: string, @CurrentUser('id') actorId?: string) {
    return this.careService.getRecords(patientId, actorId);
  }

  @Post('records')
  @ApiOperation({ summary: 'Upload medical record' })
  async createRecord(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createRecord(body, userId);
  }

  @Get('patients/:id/records')
  @ApiOperation({ summary: 'Get records for specific patient' })
  async getPatientRecords(@Param('id') patientId: string, @CurrentUser('id') actorId: string) {
    return this.careService.getRecords(patientId, actorId);
  }

  @Post('patients/:id/records')
  @ApiOperation({ summary: 'Upload record for specific patient' })
  async createPatientRecord(@Param('id') patientId: string, @Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createRecord({ ...body, patientId }, userId);
  }

  // Orders
  @Get('orders')
  @ApiOperation({ summary: 'List clinical orders' })
  async getOrders(@Query('patientId') patientId?: string) {
    return this.careService.getOrders(patientId);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Issue clinical order' })
  async createOrder(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createOrder(body, userId);
  }

  @Get('clinicians/:id/patients')
  @ApiOperation({ summary: 'List clinician linked patients' })
  async getClinicianPatients(@Param('id') clinicianId: string) {
    return this.careService.getClinicianPatients(clinicianId);
  }

  // Shifts
  @Get('shifts')
  @ApiOperation({ summary: 'List care shifts' })
  async getShifts(@Query('workerId') workerId?: string) {
    return this.careService.getShifts(workerId);
  }

  @Post('shifts')
  @ApiOperation({ summary: 'Schedule shift' })
  async createShift(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createShift(body, userId);
  }

  @Get('nurse/shifts')
  @ApiOperation({ summary: 'Nurse shift roster' })
  async getNurseShifts(@CurrentUser('id') userId: string) {
    return this.careService.getShifts(userId);
  }

  @Post('nurse/shifts')
  @ApiOperation({ summary: 'Nurse log shift handover' })
  async createNurseShift(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createShift(body, userId);
  }

  // Escalations
  @Get('escalations')
  @ApiOperation({ summary: 'List clinical escalations' })
  async getEscalations(@Query('patientId') patientId?: string) {
    return this.careService.getEscalations(patientId);
  }

  @Post('escalations')
  @ApiOperation({ summary: 'Raise clinical escalation' })
  async createEscalation(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createEscalation(body, userId);
  }

  @Get('nurse/escalations')
  @ApiOperation({ summary: 'Nurse view escalations' })
  async getNurseEscalations() {
    return this.careService.getEscalations();
  }

  @Post('nurse/escalations')
  @ApiOperation({ summary: 'Nurse raise escalation' })
  async createNurseEscalation(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createEscalation(body, userId);
  }

  // Discharge Plans
  @Get('discharge-plans')
  @ApiOperation({ summary: 'List discharge plans' })
  async getDischargePlans(@Query('patientId') patientId?: string) {
    return this.careService.getDischargePlans(patientId);
  }

  @Post('discharge-plans')
  @ApiOperation({ summary: 'Create discharge plan' })
  async createDischargePlan(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.careService.createDischargePlan(body, userId);
  }
}
