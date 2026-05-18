import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Req() req: any,
  ) {
    return this.conversationsService.list(
      req.user?.userId,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: any) {
    return this.conversationsService.getOne(Number(id), req.user?.userId);
  }

  @Post()
  async create(
    @Body()
    body: {
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
    @Req() req: any,
  ) {
    return this.conversationsService.create(body, req.user?.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
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
    @Req() req: any,
  ) {
    return this.conversationsService.update(Number(id), body, req.user?.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.conversationsService.remove(Number(id), req.user?.userId);
  }
}
