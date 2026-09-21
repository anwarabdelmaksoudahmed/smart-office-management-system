import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class JoinQueueDto {
  @ApiProperty()
  @IsUUID()
  roomId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partySize?: number;
}

export class SeatQueueDto {
  @ApiPropertyOptional({ default: 60, description: 'Session length in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  durationMin?: number;
}
