import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-verify-code')
  async sendVerifyCode(
    @Body()
    body: {
      email: string;
      purpose: 'register' | 'reset' | 'change-email';
    },
  ) {
    if (!body.email || !body.email.includes('@')) {
      throw new BadRequestException('请提供有效的邮箱地址');
    }
    if (
      !body.purpose ||
      !['register', 'reset', 'change-email'].includes(body.purpose)
    ) {
      throw new BadRequestException('请提供有效的用途参数');
    }
    return this.authService.sendVerificationCode(body.email, body.purpose);
  }

  @Post('register')
  async register(
    @Body() body: {
      username: string;
      email: string;
      password: string;
      code: string;
    },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; code: string; password: string },
  ) {
    return this.authService.resetPassword(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile((req as any).user.userId);
  }
}
