import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { CurrentUser, RequireRoles } from '../../common/decorators/auth.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Compliance & Governance')
@Controller('v1')
export class ComplianceController {
  constructor(private readonly cmpService: ComplianceService) {}

  @Get('cmp/controls')
  @ApiOperation({ summary: 'List statutory controls (DPDP, ISO 27001, SOC 2)' })
  async getControls() {
    return this.cmpService.getControls();
  }

  @Get('cmp/approvals')
  @RequireRoles('admin', 'finance')
  @ApiOperation({ summary: 'List maker-checker approval queue' })
  async getApprovals(@Query('status') status?: string) {
    return this.cmpService.getApprovals(status);
  }

  @Post('cmp/approvals')
  @RequireRoles('admin', 'finance')
  @ApiOperation({ summary: 'Submit approval item (Maker)' })
  async submitApproval(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.cmpService.submitApproval(body, userId);
  }

  @Post('cmp/approvals/:id/decision')
  @RequireRoles('admin', 'finance')
  @ApiOperation({ summary: 'Make approval decision (Checker - enforces segregation of duties)' })
  async decideApproval(
    @Param('id') approvalId: string,
    @Body() body: { decision: 'approved' | 'rejected'; notes: string },
    @CurrentUser('id') userId: string
  ) {
    return this.cmpService.decideApproval(approvalId, body.decision, body.notes || '', userId);
  }

  @Get('cmp/filings')
  @RequireRoles('admin', 'finance', 'auditor')
  @ApiOperation({ summary: 'List statutory regulatory filings' })
  async getFilings() {
    return this.cmpService.getFilings();
  }

  @Post('me/consents')
  @ApiOperation({ summary: 'Grant or revoke purpose-bound consent (DPDP Act 2023)' })
  async recordConsent(
    @CurrentUser('id') userId: string,
    @Body() body: { purpose: string; status: 'active' | 'revoked'; granteeId?: string }
  ) {
    return this.cmpService.recordConsent(userId, body.purpose, body.status, body.granteeId);
  }

  @Post('me/data-exports')
  @ApiOperation({ summary: 'Submit DPDP data portability request' })
  async requestDataExport(@CurrentUser('id') userId: string) {
    return this.cmpService.requestDataExport(userId);
  }

  @Post('me/erasure-requests')
  @ApiOperation({ summary: 'Submit DPDP right-to-be-forgotten request (legal hold verified)' })
  async requestErasure(@CurrentUser('id') userId: string) {
    return this.cmpService.requestErasure(userId);
  }
}
