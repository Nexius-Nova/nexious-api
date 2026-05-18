import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- Personal profile (any authenticated user) ---

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.getMyProfile(req.user.userId);
  }

  @Patch('me')
  async updateProfile(
    @Request() req: any,
    @Body() body: { username?: string; password?: string },
  ) {
    return this.usersService.updateMyProfile(req.user.userId, body);
  }

  @Patch('me/email')
  async updateEmail(
    @Request() req: any,
    @Body() body: { email: string; code: string },
  ) {
    return this.usersService.updateMyEmail(req.user.userId, body);
  }

  // --- Admin-only user management ---

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(
    @Body()
    body: {
      username: string;
      email: string;
      password: string;
      role?: string;
    },
  ) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { username?: string; email?: string; role?: string },
  ) {
    return this.usersService.update(id, body, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id, req.user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async toggleStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.toggleStatus(id, req.user);
  }

  @Patch(':id/reset-password')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async resetPassword(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { password: string },
  ) {
    return this.usersService.resetPassword(id, body.password, req.user);
  }
}
