import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from '../../../common/transforms/to-boolean';

export class CreateCategoryDto {
  @ApiProperty({ example: 'hot-drinks' })
  @IsString()
  slug!: string;

  @ApiProperty({ example: 'Hot Drinks' })
  @IsString()
  nameEn!: string;

  @ApiProperty({ example: 'مشروبات ساخنة' })
  @IsString()
  nameAr!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoriesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Include nested children' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  tree?: boolean;
}
