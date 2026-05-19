import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { BillingSchedulerService } from './billing-scheduler.service';

@Module({
  imports: [BillingModule],
  providers: [BillingSchedulerService],
})
export class SchedulerModule {}
