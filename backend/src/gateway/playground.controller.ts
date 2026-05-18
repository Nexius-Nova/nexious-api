import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('playground')
@UseGuards(JwtAuthGuard)
export class PlaygroundController {
  constructor(private readonly gatewayService: GatewayService) {}

  private getContext(req: any) {
    return {
      userId: req.user?.userId,
    };
  }

  @Post('chat')
  async chat(
    @Body()
    body: {
      model: string;
      messages: { role: string; content: string }[];
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    },
    @Req() req: any,
  ) {
    return this.gatewayService.playgroundChat(body, this.getContext(req));
  }

  @Post('chat/stream')
  async chatStream(
    @Body()
    body: {
      model: string;
      messages: { role: string; content: string }[];
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    },
    @Res() res: Response,
    @Req() req: any,
  ) {
    await this.gatewayService.playgroundChatStream(
      body,
      res,
      this.getContext(req),
    );
  }

  @Post('image')
  async generateImage(
    @Body()
    body: {
      model: string;
      prompt: string;
      size?: string;
      quality?: string;
      n?: number;
    },
    @Req() req: any,
  ) {
    return this.gatewayService.playgroundImage(body, this.getContext(req));
  }

  @Post('video')
  async generateVideo(
    @Body()
    body: {
      model: string;
      prompt: string;
      size?: string;
      duration?: number;
      n?: number;
    },
    @Req() req: any,
  ) {
    return this.gatewayService.playgroundVideo(body, this.getContext(req));
  }

  @Post('audio')
  async generateAudio(
    @Body()
    body: {
      model: string;
      input: string;
      voice?: string;
      speed?: number;
      format?: string;
    },
    @Req() req: any,
  ) {
    return this.gatewayService.playgroundAudio(body, this.getContext(req));
  }
}
