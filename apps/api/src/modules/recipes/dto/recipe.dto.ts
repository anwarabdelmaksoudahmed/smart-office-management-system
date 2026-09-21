import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UnitOfMeasure } from '@prisma/client';

export class RecipeLineDto {
  @ApiProperty()
  @IsUUID()
  ingredientId!: string;

  @ApiProperty({ example: 250 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiProperty({ enum: UnitOfMeasure, example: UnitOfMeasure.ML })
  @IsEnum(UnitOfMeasure)
  unit!: UnitOfMeasure;
}

export class UpsertRecipeDto {
  @ApiProperty({ example: 'Latte Recipe' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [RecipeLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLineDto)
  lines!: RecipeLineDto[];
}
