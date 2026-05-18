import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: {
      startDate?: string;
      endDate?: string;
      model?: string;
      keyword?: string;
      tokenId?: number;
    },
    userId?: number,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // User isolation: everyone only sees their own logs
    if (userId) {
      where.userId = userId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters?.model) {
      where.model = { contains: filters.model };
    }

    if (filters?.tokenId) {
      where.tokenId = filters.tokenId;
    }

    if (filters?.keyword) {
      where.OR = [
        { model: { contains: filters.keyword } },
        { ip: { contains: filters.keyword } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.log.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          token: { select: { name: true } },
          channel: { select: { name: true } },
        },
      }),
      this.prisma.log.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async create(data: any) {
    return this.prisma.log.create({ data });
  }

  async getStats(userId?: number) {
    // Build base where for user isolation
    const userWhere: any = userId ? { userId } : {};
    const beijingOffset = 8 * 60 * 60 * 1000;
    const now = new Date();
    const beijingNow = new Date(now.getTime() + beijingOffset);
    const todayStart = new Date(
      beijingNow.getFullYear(),
      beijingNow.getMonth(),
      beijingNow.getDate(),
      0,
      0,
      0,
      0,
    );
    // Convert back to UTC for Prisma query
    const todayStartUtc = new Date(todayStart.getTime() - beijingOffset);

    const [totalTokens, todayAgg, totalRequests, todayLogs] = await Promise.all(
      [
        this.prisma.log.aggregate({
          where: userWhere,
          _sum: { totalTokens: true },
        }),
        this.prisma.log.aggregate({
          where: { ...userWhere, createdAt: { gte: todayStartUtc } },
          _sum: {
            totalTokens: true,
            promptTokens: true,
            completionTokens: true,
          },
          _count: { id: true },
        }),
        this.prisma.log.count({ where: userWhere }),
        this.prisma.log.findMany({
          where: { ...userWhere, createdAt: { gte: todayStartUtc } },
          select: { totalTokens: true },
        }),
      ],
    );

    const todayTotalTokens = todayAgg._sum.totalTokens || 0;
    const todayRequestCount = todayLogs.length;
    const avgTokensPerRequest =
      todayRequestCount > 0
        ? Math.round(todayTotalTokens / todayRequestCount)
        : 0;

    return {
      totalTokens: totalTokens._sum.totalTokens || 0,
      todayTokens: todayTotalTokens,
      totalRequests,
      todayRequests: todayRequestCount,
      avgTokensPerRequest,
    };
  }

  async getDailyUsage(days: number, userId?: number) {
    const beijingOffset = 8 * 60 * 60 * 1000;
    const now = new Date();
    const beijingNow = new Date(now.getTime() + beijingOffset);

    const since = new Date(beijingNow);
    since.setDate(since.getDate() - days);
    const sinceUtc = new Date(since.getTime() - beijingOffset);

    // Aggregate at database level using raw SQL for date grouping
    const rows = await this.prisma.$queryRawUnsafe<
      { date: string; totalTokens: number; requestCount: number }[]
    >(
      `SELECT
        DATE(DATE_ADD(createdAt, INTERVAL 8 HOUR)) AS \`date\`,
        SUM(totalTokens) AS totalTokens,
        COUNT(*) AS requestCount
      FROM \`Log\`
      WHERE createdAt >= ?
        ${userId ? 'AND userId = ?' : ''}
      GROUP BY DATE(DATE_ADD(createdAt, INTERVAL 8 HOUR))
      ORDER BY \`date\` ASC`,
      sinceUtc,
      ...(userId ? [userId] : []),
    );

    // Build a map from the aggregated rows
    const aggMap = new Map<string, { totalTokens: number; requestCount: number }>();
    for (const row of rows) {
      aggMap.set(row.date, {
        totalTokens: Number(row.totalTokens),
        requestCount: Number(row.requestCount),
      });
    }

    // Fill all dates with zeroes
    const result: { date: string; totalTokens: number; requestCount: number }[] = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(beijingNow);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = aggMap.get(key);
      result.push({
        date: key,
        totalTokens: entry?.totalTokens ?? 0,
        requestCount: entry?.requestCount ?? 0,
      });
    }

    return result;
  }

  async getModelDistribution(userId?: number) {
    const userWhere: any = userId ? { userId } : {};
    const models = await this.prisma.log.groupBy({
      by: ['model'],
      where: userWhere,
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: { model: true },
      orderBy: { _sum: { totalTokens: 'desc' } },
    });

    return models.map((m) => ({
      model: m.model,
      totalTokens: m._sum.totalTokens || 0,
      promptTokens: m._sum.promptTokens || 0,
      completionTokens: m._sum.completionTokens || 0,
      requestCount: m._count.model,
    }));
  }
}
