import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UnitOfMeasure } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateIngredientDto {
  @ApiProperty({ example: 'MILK-001' })
  @IsString()
  sku!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 'Milk' })
  @IsString()
  nameEn!: string;

  @ApiProperty({ example: 'حليب' })
  @IsString()
  nameAr!: string;

  @ApiProperty({ enum: UnitOfMeasure, example: UnitOfMeasure.ML })
  @IsEnum(UnitOfMeasure)
  unit!: UnitOfMeasure;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  expiryTrack?: boolean;
}

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}

export class IngredientsQueryDto extends PaginationQueryDto {}
