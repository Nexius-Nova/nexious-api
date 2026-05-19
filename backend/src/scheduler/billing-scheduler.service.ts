import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class BillingSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(BillingSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  // Default polling interval: 10 minutes
  private readonly POLL_INTERVAL_MS =
    parseInt(process.env['BALANCE_POLL_INTERVAL_MS'] || '600000', 10);

  constructor(private readonly billingService: BillingService) {}

  onModuleInit() {
    // Initial delay of 30s to let the app fully start
    setTimeout(() => {
      this.startPolling();
    }, 30000);
  }

  private startPolling() {
    this.logger.log(
      `Starting balance polling every ${this.POLL_INTERVAL_MS / 1000}s`,
    );

    // Run once immediately after startup delay
    this.pollBalances();

    this.timer = setInterval(() => {
      this.pollBalances();
    }, this.POLL_INTERVAL_MS);
  }

  private async pollBalances() {
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
    } catch (err: any) {
      this.logger.error(`Balance polling error: ${err.message}`);
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
