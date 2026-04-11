import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListWarehousesQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly pageSize?: number = 20;

  @ApiPropertyOptional({ example: 'CDMX-01' })
  @IsOptional()
  @IsString()
  readonly code?: string;

  @ApiPropertyOptional({ example: 'Almacén CDMX' })
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  readonly status?: 'active' | 'inactive';
}
