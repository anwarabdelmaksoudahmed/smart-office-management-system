import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UnitOfMeasure } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateWasteDto {
  @ApiProperty()
  @IsUUID()
  ingredientId!: string;

  @ApiProperty({ example: 250 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({ enum: UnitOfMeasure })
  @IsEnum(UnitOfMeasure)
  unit!: UnitOfMeasure;

  @ApiProperty({ example: 'Expired milk' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}

export class WasteQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ingredientId?: string;
}
