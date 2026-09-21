import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateRoomDto {
  @ApiProperty({ example: 'ROOM-PS5' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'PlayStation Lounge' })
  @IsString()
  nameEn!: string;

  @ApiProperty({ example: 'صالة بلاي ستيشن' })
  @IsString()
  nameAr!: string;

  @ApiPropertyOptional({ default: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}

export class RoomsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;
}
