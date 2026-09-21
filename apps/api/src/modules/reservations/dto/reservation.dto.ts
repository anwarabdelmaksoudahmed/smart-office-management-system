import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { GamingBookingStatus } from '@prisma/client';

export class CreateReservationDto {
  @ApiProperty()
  @IsUUID()
  roomId!: string;

  @ApiProperty({ example: '2026-08-06T10:00:00.000Z' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: '2026-08-06T11:00:00.000Z' })
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partySize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ExtendReservationDto {
  @ApiProperty({ example: 15, description: 'Minutes to extend' })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  minutes!: number;
}

export class ReservationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: GamingBookingStatus })
  @IsOptional()
  @IsString()
  status?: GamingBookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roomId?: string;
}
