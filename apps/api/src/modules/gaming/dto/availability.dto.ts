import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityQueryDto {
  @ApiProperty()
  @IsUUID()
  roomId!: string;

  @ApiProperty({ example: '2026-08-06', description: 'ISO date (YYYY-MM-DD)' })
  @IsString()
  date!: string;

  @ApiPropertyOptional({ default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  slotMinutes?: number;
}
