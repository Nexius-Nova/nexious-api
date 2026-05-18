import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  private maskApiKey(key: string): string {
    if (!key || key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }

  private isMasked(value: string | undefined): boolean {
    return !!value && value.includes('****');
  }

  async findAll(userId?: number) {
    // Everyone sees their own channels + public channels
    const where: any = {
      OR: [{ userId: userId || -1 }, { visibility: 'public' }],
    };
    const channels = await this.prisma.channel.findMany({
      where,
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Mask API keys in list responses
    return channels.map((ch) => ({
      ...ch,
      apiKey: this.maskApiKey(ch.apiKey),
    }));
  }

  async findOne(id: number) {
    return this.prisma.channel.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true } } },
    });
  }

  async create(data: any) {
    const { id, createdAt, updatedAt, user, ...rest } = data;
    return this.prisma.channel.create({ data: rest });
  }

  async update(id: number, data: any) {
    const { id: _, createdAt, updatedAt, user, ...rest } = data;
    // If apiKey is masked (user didn't provide a new one), remove it from update
    if (rest.apiKey && this.isMasked(rest.apiKey)) {
      delete rest.apiKey;
    }
    return this.prisma.channel.update({ where: { id }, data: rest });
  }

  async remove(id: number) {
    return this.prisma.channel.delete({ where: { id } });
  }

  async testConnection(id: number) {
    const channel = await this.findOne(id);
    if (!channel) {
      return { success: false, error: '渠道不存在' };
    }

    const start = Date.now();
    try {
      await axios.get(`${channel.baseUrl}/v1/models`, {
        headers: {
          Authorization: `Bearer ${channel.apiKey}`,
        },
        timeout: 10000,
      });
      return { success: true, latency: Date.now() - start };
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || error.message || '连接失败';
      return { success: false, error: message, latency: Date.now() - start };
    }
  }
}
