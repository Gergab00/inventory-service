import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListInventoryMovementsQueryDto {
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

  @ApiPropertyOptional({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  @IsOptional()
  @IsString()
  readonly productId?: string;

  @ApiPropertyOptional({ example: 'wh_01JX9XB92E4S9P3Q8T6N1R5M7K' })
  @IsOptional()
  @IsString()
  readonly warehouseId?: string;

  @ApiPropertyOptional({ enum: ['entry', 'exit', 'adjustment'] })
  @IsOptional()
  @IsIn(['entry', 'exit', 'adjustment'])
  readonly type?: 'entry' | 'exit' | 'adjustment';
}
