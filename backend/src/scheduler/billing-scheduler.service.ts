import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class BillingSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BillingSchedulerService.name);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isPolling = false;

  // Default polling interval: 10 minutes
  private readonly POLL_INTERVAL_MS =
    parseInt(process.env['BALANCE_POLL_INTERVAL_MS'] || '600000', 10);

  constructor(private readonly billingService: BillingService) {}

  onModuleInit() {
    this.logger.log(
      `Starting balance polling every ${this.POLL_INTERVAL_MS / 1000}s`,
    );
    // Initial delay of 30s to let the app fully start
    setTimeout(() => {
      this.scheduleNext();
    }, 30000);
  }

  private scheduleNext() {
    this.timeoutId = setTimeout(async () => {
      if (this.isPolling) return;
      this.isPolling = true;
      try {
        const result = await this.billingService.refreshAllBalances();
        this.logger.log(
          `Balance polling complete: ${result.success} success, ${result.failed} failed`,
        );
        if (result.errors.length > 0) {
          this.logger.warn(
            `Balance polling errors: ${JSON.stringify(result.errors)}`,
          );
        }
      } catch (error: any) {
        this.logger.error('Balance poll failed', error);
      } finally {
        this.isPolling = false;
        this.scheduleNext();
      }
    }, this.POLL_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
