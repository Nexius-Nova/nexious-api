import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  // ==================== Personal Profile ====================

  async getMyProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...rest } = user;
    return rest;
  }

  async updateMyProfile(
    userId: number,
    dto: { username?: string; password?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.username && dto.username !== user.username) {
      const dup = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (dup) throw new ConflictException('Username already taken');
    }

    const data: any = {};
    if (dto.username) data.username = dto.username;
    if (dto.password) {
      if (dto.password.length < 6)
        throw new ConflictException('Password must be at least 6 characters');
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    const { password, ...rest } = updated;
    return rest;
  }

  async updateMyEmail(userId: number, dto: { email: string; code: string }) {
    // Validate the verification code
    this.authService.consumeEmailCode(dto.email, dto.code);

    // Check if email is already taken by another user
    const dup = await this.prisma.user.findFirst({
      where: { email: dto.email, NOT: { id: userId } },
    });
    if (dup) {
      throw new ConflictException('该邮箱已被其他账号使用');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.email },
    });

    const { password, ...rest } = updated;
    return rest;
  }

  // ==================== Admin User Management ====================

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ password, ...rest }) => rest);
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...rest } = user;
    return rest;
  }

  async create(dto: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existing)
      throw new ConflictException('Username or email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        role: dto.role || 'user',
      },
    });
    const { password, ...rest } = user;
    return rest;
  }

  async update(
    id: number,
    dto: { username?: string; email?: string; role?: string },
    requester?: { userId: number; role: string },
  ) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');

    this.checkPermissions(requester, target, 'update');

    if (dto.username && dto.username !== target.username) {
      const dup = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (dup) throw new ConflictException('Username already taken');
    }
    if (dto.email && dto.email !== target.email) {
      const dup = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (dup) throw new ConflictException('Email already taken');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        username: dto.username ?? target.username,
        email: dto.email ?? target.email,
        role: dto.role ?? target.role,
      },
    });
    const { password, ...rest } = updated;
    return rest;
  }

  async remove(id: number, requester?: { userId: number; role: string }) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');

    this.checkPermissions(requester, target, 'delete');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }

  async toggleStatus(id: number, requester?: { userId: number; role: string }) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');

    this.checkPermissions(requester, target, 'modify');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: !target.status },
    });
    const { password, ...rest } = updated;
    return rest;
  }

  async resetPassword(
    id: number,
    newPassword: string,
    requester?: { userId: number; role: string },
  ) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');

    this.checkPermissions(requester, target, 'modify');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { message: 'Password reset successfully' };
  }

  // ==================== Permission Helpers ====================

  private checkPermissions(
    requester: { userId: number; role: string } | undefined,
    target: { id: number; role: string },
    action: string,
  ) {
    if (!requester) return; // No requester context (e.g. seed)

    // Cannot modify yourself through admin panel
    if (requester.userId === target.id) {
      throw new ForbiddenException(
        'Cannot modify your own account through user management. Use Personal Info instead.',
      );
    }

    // super_admin protection — only another super_admin can touch them (but not themselves)
    if (target.role === 'super_admin') {
      throw new ForbiddenException('Cannot modify the super administrator.');
    }

    // Admin cannot modify other admins — only super_admin can
    if (requester.role === 'admin' && target.role === 'admin') {
      throw new ForbiddenException('Admins cannot modify other admins.');
    }
  }
}
