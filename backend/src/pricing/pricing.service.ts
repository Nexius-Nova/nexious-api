import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  pricingSnapshot: {
    model: string;
    inputPricePer1M: number | string;
    outputPricePer1M: number | string;
    currency: string;
  };
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async findAll(channelId?: number) {
    const where: any = {};
    if (channelId) where.channelId = channelId;

    return this.prisma.modelPricing.findMany({
      where,
      include: { channel: { select: { id: true, name: true } } },
      orderBy: [{ channelId: 'asc' }, { model: 'asc' }],
    });
  }

  async findOne(id: number) {
    return this.prisma.modelPricing.findUnique({ where: { id } });
  }

  async create(data: any) {
    const { id, createdAt, updatedAt, ...rest } = data;
    return this.prisma.modelPricing.create({
      data: {
        ...rest,
        inputPricePer1M: new Prisma.Decimal(rest.inputPricePer1M || 0),
        outputPricePer1M: new Prisma.Decimal(rest.outputPricePer1M || 0),
      },
    });
  }

  async update(id: number, data: any) {
    const { id: _, createdAt, updatedAt, channelId, ...rest } = data;
    const updateData: any = { ...rest };
    if (updateData.inputPricePer1M !== undefined) {
      updateData.inputPricePer1M = new Prisma.Decimal(updateData.inputPricePer1M);
    }
    if (updateData.outputPricePer1M !== undefined) {
      updateData.outputPricePer1M = new Prisma.Decimal(updateData.outputPricePer1M);
    }
    return this.prisma.modelPricing.update({ where: { id }, data: updateData });
  }

  async remove(id: number) {
    return this.prisma.modelPricing.delete({ where: { id } });
  }

  /**
   * Find the best matching pricing for a channel + model combination.
   */
  async findPricing(
    channelId: number,
    model: string,
  ): Promise<CostCalculation['pricingSnapshot'] | null> {
    const pricing = await this.prisma.modelPricing.findFirst({
      where: { channelId, model },
      orderBy: { effectiveAt: 'desc' },
    });

    if (pricing) {
      return {
        model: pricing.model,
        inputPricePer1M: pricing.inputPricePer1M.toString(),
        outputPricePer1M: pricing.outputPricePer1M.toString(),
        currency: pricing.currency,
      };
    }

    return null;
  }

  /**
   * Calculate cost for a single request.
   * Price is per 1M tokens; divides token counts by 1,000,000.
   * Returns null if no pricing is configured (cost stays 0).
   */
  async calculateCost(
    channelId: number,
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): Promise<CostCalculation | null> {
    const pricing = await this.findPricing(channelId, model);
    if (!pricing) return null;

    const inputPrice = Number(pricing.inputPricePer1M);
    const outputPrice = Number(pricing.outputPricePer1M);
    const currency = pricing.currency;

    const inputCost = (promptTokens / 1000000) * inputPrice;
    const outputCost = (completionTokens / 1000000) * outputPrice;
    const totalCost = inputCost + outputCost;

    return {
      inputCost: Math.round(inputCost * 1e8) / 1e8,
      outputCost: Math.round(outputCost * 1e8) / 1e8,
      totalCost: Math.round(totalCost * 1e8) / 1e8,
      currency,
      pricingSnapshot: pricing,
    };
  }
}
