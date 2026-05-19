import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class CreateModelPricingDto {
  @IsInt()
  channelId: number;

  @IsString()
  model: string;

  @IsNumber()
  @Min(0)
  inputPricePer1K: number;

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
  @IsNumber()
  @Min(0)
  inputPricePer1K?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  outputPricePer1K?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
