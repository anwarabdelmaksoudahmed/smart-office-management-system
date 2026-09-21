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
import { ToBoolean } from '../../../common/transforms/to-boolean';
import { StockMovementType, StockItemType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AdjustStockDto {
  @ApiProperty()
  @IsUUID()
  stockItemId!: string;

  @ApiProperty({
    description: 'Signed delta: positive adds stock, negative removes',
    example: 500,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  quantityDelta!: number;

  @ApiPropertyOptional({ enum: StockMovementType, default: StockMovementType.ADJUSTMENT })
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class UpdateStockMetaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string | null;
}

export class StockQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StockItemType })
  @IsOptional()
  @IsEnum(StockItemType)
  type?: StockItemType;

  @ApiPropertyOptional({ description: 'Only items at or below reorder level' })
  @IsOptional()
  @ToBoolean()
  lowOnly?: boolean;

  @ApiPropertyOptional({ description: 'Only items with expiry within N days' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  expiringWithinDays?: number;
}

export class MovementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  stockItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ingredientId?: string;

  @ApiPropertyOptional({ enum: StockMovementType })
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;
}
