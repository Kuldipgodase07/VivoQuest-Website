import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { IamService } from './iam.service';
import { Public, CurrentUser } from '../../common/decorators/auth.decorators';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Identity & Access')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly iamService: IamService) {}

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 6-digit OTP to mobile phone via DLT template' })
  async sendOtp(
    @Body() body: { phoneE164: string; city?: string },
    @Req() req: any
  ) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    return this.iamService.sendOtp(body.phoneE164, ip, body.city);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP, establish session, and return JWT' })
  async verifyOtp(
    @Body() body: { phoneE164: string; code: string; city?: string; role?: string },
    @Req() req: any
  ) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    return this.iamService.verifyOtp(body.phoneE164, body.code, body.city, body.role, ip);
  }

  @Public()
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new 15-minute access JWT' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.iamService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke current session and logout' })
  async logout(@CurrentUser() user: any) {
    return this.iamService.logout(user?.sessionId, user?.id);
  }
}
