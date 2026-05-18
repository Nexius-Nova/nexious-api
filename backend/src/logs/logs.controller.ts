import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('model') model?: string,
    @Query('keyword') keyword?: string,
    @Query('tokenId') tokenId?: string,
    @Req() req?: any,
  ) {
    return this.logsService.findAll(
      +page || 1,
      +limit || 20,
      {
        startDate,
        endDate,
        model,
        keyword,
        tokenId: tokenId ? +tokenId : undefined,
      },
      req?.user?.userId,
    );
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.logsService.getStats(req.user?.userId);
  }

  @Get('stats/daily')
  getDailyUsage(@Query('days') days: string, @Req() req: any) {
    return this.logsService.getDailyUsage(+days || 7, req.user?.userId);
  }

  @Get('stats/models')
  getModelDistribution(@Req() req: any) {
    return this.logsService.getModelDistribution(req.user?.userId);
  }
}
