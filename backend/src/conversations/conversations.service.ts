import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: number | undefined, page: number, limit: number) {
    const where: any = userId ? { userId } : {};
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        skip,
        take: limit,
        where,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          model: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return { items, total };
  }

  async getOne(id: number, userId: number | undefined) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }
    return this.prisma.conversation.findUnique({ where });
  }

  async create(
    data: {
      title?: string;
      messages: any[];
      model: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      streamEnabled?: boolean;
      debugInfo?: string;
      imageUrl?: string;
    },
    userId: number,
  ) {
    return this.prisma.conversation.create({
      data: {
        title: data.title || 'Untitled',
        messages: JSON.stringify(data.messages),
        model: data.model,
        systemPrompt: data.systemPrompt || '',
        temperature: data.temperature ?? 0.7,
        maxTokens: data.maxTokens ?? 4096,
        topP: data.topP ?? 1.0,
        streamEnabled: data.streamEnabled ?? false,
        debugInfo: data.debugInfo || null,
        imageUrl: data.imageUrl || null,
        userId,
      },
    });
  }

  async update(
    id: number,
    body: {
      title?: string;
      messages?: any[];
      model?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      streamEnabled?: boolean;
      debugInfo?: string;
      imageUrl?: string;
    },
    userId: number | undefined,
  ) {
    const existing = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!existing || (userId && existing.userId !== userId)) {
      throw new ForbiddenException(
        'You can only update your own conversations',
      );
    }

    const data: any = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.messages !== undefined)
      data.messages = JSON.stringify(body.messages);
    if (body.model !== undefined) data.model = body.model;
    if (body.systemPrompt !== undefined) data.systemPrompt = body.systemPrompt;
    if (body.temperature !== undefined) data.temperature = body.temperature;
    if (body.maxTokens !== undefined) data.maxTokens = body.maxTokens;
    if (body.topP !== undefined) data.topP = body.topP;
    if (body.streamEnabled !== undefined)
      data.streamEnabled = body.streamEnabled;
    if (body.debugInfo !== undefined) data.debugInfo = body.debugInfo;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;

    return this.prisma.conversation.update({ where: { id }, data });
  }

  async remove(id: number, userId: number | undefined) {
    const existing = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!existing || (userId && existing.userId !== userId)) {
      throw new ForbiddenException(
        'You can only delete your own conversations',
      );
    }
    return this.prisma.conversation.delete({ where: { id } });
  }
}
