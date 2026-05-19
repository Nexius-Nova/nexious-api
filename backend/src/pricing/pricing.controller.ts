import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateModelPricingDto, UpdateModelPricingDto } from './dto/model-pricing.dto';

@Controller('model-pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  findAll(@Query('channelId') channelId?: string) {
    return this.pricingService.findAll(channelId ? +channelId : undefined);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pricing = await this.pricingService.findOne(+id);
    if (!pricing) throw new NotFoundException('Pricing not found');
    return pricing;
  }

  @Post()
  create(@Body() data: CreateModelPricingDto) {
    return this.pricingService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateModelPricingDto) {
    const existing = await this.pricingService.findOne(+id);
    if (!existing) throw new NotFoundException('Pricing not found');
    return this.pricingService.update(+id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await this.pricingService.findOne(+id);
    if (!existing) throw new NotFoundException('Pricing not found');
    return this.pricingService.remove(+id);
  }
}
