import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'CUSTOM_ROLE' })
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  nameEn!: string;

  @ApiProperty()
  @IsString()
  nameAr!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class AssignPermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
