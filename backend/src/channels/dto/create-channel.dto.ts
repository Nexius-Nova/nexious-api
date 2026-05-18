import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateChannelDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsUrl({ require_tld: false })
  baseUrl: string;

  @IsString()
  apiKey: string;

  @IsString()
  models: string;

  @IsOptional()
  @IsString()
  modelTypes?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: string;
}

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  models?: string;

  @IsOptional()
  @IsString()
  modelTypes?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: string;
}
