import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { IamService } from './iam.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { DatabaseService } from '../../common/database/database.service';
import { ObjectId } from 'mongodb';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Identity & Access')
@Controller('v1/me')
export class MeController {
  constructor(
    private readonly iamService: IamService,
    private readonly db: DatabaseService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile, active role and permissions' })
  async getProfile(@CurrentUser() user: any) {
    const userDoc = await this.db.getCollection('iam_users').findOne({ _id: new ObjectId(user.id) });
    const currentRole = userDoc?.currentRole || user.currentRole || 'patient';
    const roleDoc = await this.db.getCollection('iam_roles').findOne({ key: currentRole });

    return {
      id: String(userDoc?._id || user.id),
      phoneHash: userDoc?.phoneHash,
      roles: userDoc?.roles || [],
      currentRole,
      city: userDoc?.city || 'Pune',
      preferredLanguage: userDoc?.preferredLanguage || 'en',
      permissions: roleDoc?.permissions || [],
      status: userDoc?.status || 'active'
    };
  }

  @Put('role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch active user role and receive updated token' })
  async switchRole(
    @CurrentUser() user: any,
    @Body() body: { role: string }
  ) {
    return this.iamService.switchRole(user.id, body.role);
  }
}
