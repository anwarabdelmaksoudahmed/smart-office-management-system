import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from '../../../common/transforms/to-boolean';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateDeviceDto {
  @ApiProperty()
  @IsUUID()
  roomId!: string;

  @ApiProperty({ example: 'PS5-01' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'PlayStation 5 #1' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'CONSOLE' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}

export class DevicesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  activeOnly?: boolean;
}
