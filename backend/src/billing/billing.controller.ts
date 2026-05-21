import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('channels/:id/balance')
  async getBalance(@Param('id') id: string) {
    try {
      return await this.billingService.getBalance(+id);
    } catch (err: any) {
      throw new NotFoundException(err.message);
    }
  }

  @Post('channels/:id/balance/refresh')
  async refreshBalance(@Param('id') id: string) {
    return this.billingService.refreshBalance(+id);
  }

  @Get('channels/:id/balance/snapshots')
  async getSnapshots(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.getSnapshots(+id, limit ? +limit : 20);
  }

  @Post('billing/refresh-all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async refreshAllBalances() {
    return this.billingService.refreshAllBalances();
  }
}
