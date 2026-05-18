import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tokens')
@UseGuards(JwtAuthGuard)
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.tokensService.findAll(req.user?.userId);
  }

  @Post()
  create(@Body() data: any, @Req() req: any) {
    const enriched = { ...data, userId: req.user?.userId };
    return this.tokensService.create(enriched);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const token = await this.tokensService.findOne(+id);
    if (!token) throw new NotFoundException('Token not found');
    if (token.userId !== req.user?.userId) {
      throw new ForbiddenException('You can only update your own tokens');
    }
    return this.tokensService.update(+id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const token = await this.tokensService.findOne(+id);
    if (!token) throw new NotFoundException('Token not found');
    if (token.userId !== req.user?.userId) {
      throw new ForbiddenException('You can only delete your own tokens');
    }
    return this.tokensService.remove(+id);
  }
}
