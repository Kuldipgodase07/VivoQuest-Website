import { Controller, Get, Put, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('v1/me/notification-preferences')
export class NotificationsController {
  constructor(private readonly ntfService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notification channel preferences' })
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.ntfService.getPreferences(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update notification channels (SMS, WhatsApp, Email)' })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() body: { sms?: boolean; email?: boolean; whatsapp?: boolean; push?: boolean }
  ) {
    return this.ntfService.updatePreferences(userId, body);
  }
}
