import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateTokenDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(-1)
  quota?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  allowedModels?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateTokenDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(-1)
  quota?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  allowedModels?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsString()
  note?: string;
}
