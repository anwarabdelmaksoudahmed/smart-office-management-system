import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingItemDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty({ description: 'JSON value payload' })
  @IsObject()
  value!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  group?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ type: [UpdateSettingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSettingItemDto)
  settings!: UpdateSettingItemDto[];
}
