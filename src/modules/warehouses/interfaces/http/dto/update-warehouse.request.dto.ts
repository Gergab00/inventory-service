import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWarehouseRequestDto {
  @ApiPropertyOptional({ example: 'CDMX-01' })
  @IsOptional()
  @IsString()
  readonly code?: string;

  @ApiPropertyOptional({ example: 'Almacén CDMX Norte' })
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly processingTimeDays?: number;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  readonly status?: 'active' | 'inactive';
}
