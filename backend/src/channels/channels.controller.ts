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
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateChannelDto, UpdateChannelDto } from './dto/create-channel.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.channelsService.findAll(req.user?.userId);
  }

  @Post()
  create(@Body() data: CreateChannelDto, @Req() req: any) {
    // Set userId from JWT; regular users always get private visibility
    const isAdmin =
      req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const channelData = {
      ...data,
      userId: req.user?.userId,
      visibility: isAdmin ? data.visibility || 'private' : 'private',
    };
    return this.channelsService.create(channelData);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateChannelDto,
    @Req() req: any,
  ) {
    const channel = await this.channelsService.findOne(+id);
    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.userId !== req.user?.userId) {
      throw new ForbiddenException(
        'Only the channel creator can modify this channel',
      );
    }
    const isAdmin =
      req.user?.role === 'admin' || req.user?.role === 'super_admin';
    // Regular users cannot change visibility
    if (!isAdmin) {
      delete data.visibility;
    }
    return this.channelsService.update(+id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const channel = await this.channelsService.findOne(+id);
    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.userId !== req.user?.userId) {
      throw new ForbiddenException(
        'Only the channel creator can delete this channel',
      );
    }
    return this.channelsService.remove(+id);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: string) {
    return this.channelsService.testConnection(+id);
  }
}
