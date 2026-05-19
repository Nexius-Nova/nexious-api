import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModelPricingDto {
  @Type(() => Number)
  @IsInt()
  channelId: number;

  @IsString()
  model: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inputPricePer1M: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outputPricePer1M: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateModelPricingDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  channelId?: number;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inputPricePer1M?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outputPricePer1M?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
