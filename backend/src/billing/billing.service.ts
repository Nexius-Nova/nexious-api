import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProviderAdapter,
  OpenAIAdapter,
  DeepSeekAdapter,
  KimiAdapter,
} from '../provider-adapters';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor(private prisma: PrismaService) {
    // Register built-in adapters
    this.adapters.set('openai', new OpenAIAdapter());
    this.adapters.set('openai-compatible', new OpenAIAdapter());
    this.adapters.set('deepseek', new DeepSeekAdapter());
    this.adapters.set('deepseek-compatible', new DeepSeekAdapter());
    this.adapters.set('kimi', new KimiAdapter());
    this.adapters.set('moonshot', new KimiAdapter());
  }

  getAdapter(type: string): ProviderAdapter | null {
    return this.adapters.get(type) || null;
  }

  registerAdapter(type: string, adapter: ProviderAdapter): void {
    this.adapters.set(type, adapter);
  }

  /**
   * Fetch balance from upstream provider and save a snapshot.
   * Updates Channel.lastBalance on success.
   */
  async refreshBalance(channelId: number): Promise<{
    balance: number;
    currency: string;
    fetchedAt: Date;
  }> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) throw new Error(`Channel ${channelId} not found`);
    if (!channel.balanceEnabled) throw new Error(`Balance not enabled for channel ${channelId}`);

    const adapter = this.getAdapter(channel.balanceApiType || 'openai-compatible');
    if (!adapter) throw new Error(`No adapter for type: ${channel.balanceApiType}`);

    const info = await adapter.fetchBalance({
      baseUrl: channel.baseUrl,
      apiKey: channel.apiKey,
      balanceApiConfig: channel.balanceApiConfig,
    });

    // Save snapshot
    await this.prisma.channelBalanceSnapshot.create({
      data: {
        channelId,
        balance: info.balance,
        currency: info.currency,
        rawData: info.rawData ? JSON.stringify(info.rawData) : null,
      },
    });

    // Update channel lastBalance
    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        lastBalance: info.balance,
        lastBalanceAt: new Date(),
        currency: info.currency,
      },
    });

    this.logger.log(`Balance refreshed for channel ${channelId}: ${info.balance} ${info.currency}`);

    return {
      balance: info.balance,
      currency: info.currency,
      fetchedAt: new Date(),
    };
  }

  /**
   * Get balance snapshots for a channel (paginated).
   */
  async getSnapshots(channelId: number, limit: number = 20) {
    return this.prisma.channelBalanceSnapshot.findMany({
      where: { channelId },
      orderBy: { fetchedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Refresh balances for all enabled channels.
   * Should be called by a scheduler.
   */
  async refreshAllBalances(): Promise<{
    success: number;
    failed: number;
    errors: Array<{ channelId: number; error: string }>;
  }> {
    const channels = await this.prisma.channel.findMany({
      where: { balanceEnabled: true, status: true },
    });

    let success = 0;
    let failed = 0;
    const errors: Array<{ channelId: number; error: string }> = [];

    for (const channel of channels) {
      try {
        await this.refreshBalance(channel.id);
        success++;
      } catch (err: any) {
        failed++;
        errors.push({
          channelId: channel.id,
          error: err.message || 'Unknown error',
        });
        this.logger.error(
          `Failed to refresh balance for channel ${channel.id}: ${err.message}`,
        );
      }
    }

    return { success, failed, errors };
  }

  /**
   * Get channel balance info (from last cached value, no upstream call).
   */
  async getBalance(channelId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        name: true,
        currency: true,
        lastBalance: true,
        lastBalanceAt: true,
        balanceEnabled: true,
      },
    });

    if (!channel) throw new Error(`Channel ${channelId} not found`);
    return channel;
  }
}
