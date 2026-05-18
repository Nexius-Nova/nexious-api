import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  HttpException,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { Request, Response } from 'express';

@Controller('v1/chat/completions')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post()
  async proxy(
    @Headers('authorization') auth: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip =
      req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    try {
      const result = await this.gatewayService.proxyChat(auth, body, ip);

      if (body.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        result.pipe(res);
      } else {
        res.json(result);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        const body = error.getResponse();
        res.status(status).json(body);
      } else {
        res
          .status(500)
          .json({
            error: { message: 'Internal server error', type: 'internal_error' },
          });
      }
    }
  }
}
