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
  inputPricePer1K: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outputPricePer1K: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateModelPricingDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inputPricePer1K?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outputPricePer1K?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
