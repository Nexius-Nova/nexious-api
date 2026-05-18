import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

interface CodeEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private codeStore = new Map<string, CodeEntry>();

  // Clean expired codes every 60s
  private cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of this.codeStore) {
      if (entry.expiresAt < now) this.codeStore.delete(key);
    }
  }, 60_000);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: {
    username: string;
    email: string;
    password: string;
    code: string;
  }) {
    // Validate verification code
    this.consumeEmailCode(dto.email, dto.code);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existing) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  async sendVerificationCode(
    email: string,
    purpose: 'register' | 'reset' | 'change-email',
  ) {
    // Check if email is (not) registered based on purpose
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (purpose === 'register' && user) {
      throw new ConflictException('该邮箱已被注册');
    }
    if (purpose === 'reset' && !user) {
      throw new BadRequestException('该邮箱未注册');
    }
    if (purpose === 'change-email' && user) {
      throw new ConflictException('该邮箱已被其他账号使用');
    }

    // Rate limit: 60s between sends
    const existing = this.codeStore.get(email);
    if (existing && existing.expiresAt - Date.now() > 4 * 60 * 1000) {
      throw new BadRequestException('发送过于频繁，请 60 秒后再试');
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store with 5-minute TTL
    this.codeStore.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const sent = await this.emailService.sendVerificationCode(email, code);
    if (!sent) {
      this.logger.error(`Failed to send verification code to ${email}`);
    }

    return { message: '验证码已发送，请查收邮件' };
  }

  /** Validate & consume a verification code. Throws if invalid/expired. */
  consumeEmailCode(email: string, code: string): void {
    const entry = this.codeStore.get(email);
    if (!entry) {
      throw new BadRequestException('验证码已过期或未发送，请重新获取');
    }
    if (entry.expiresAt < Date.now()) {
      this.codeStore.delete(email);
      throw new BadRequestException('验证码已过期，请重新获取');
    }
    if (entry.code !== code) {
      throw new BadRequestException('验证码错误');
    }
    this.codeStore.delete(email);
  }

  async login(dto: { username: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    if (!user.status) {
      throw new UnauthorizedException('Account has been disabled');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async resetPassword(dto: { email: string; code: string; password: string }) {
    // Validate & consume the verification code
    this.consumeEmailCode(dto.email, dto.code);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new BadRequestException('该邮箱未注册');
    }

    if (dto.password.length < 6) {
      throw new BadRequestException('密码长度不能少于 6 位');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: '密码重置成功，请返回登录' };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
