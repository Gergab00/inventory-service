import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListProductsQueryDto {
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

  @ApiPropertyOptional({ example: 'Nintendo' })
  @IsOptional()
  @IsString()
  readonly title?: string;

  @ApiPropertyOptional({ example: 'Nintendo' })
  @IsOptional()
  @IsString()
  readonly brand?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  readonly status?: 'active' | 'inactive';

  @ApiPropertyOptional({ example: 'asin' })
  @IsOptional()
  @IsString()
  readonly identifierType?: string;

  @ApiPropertyOptional({ example: 'B07TWW67JS' })
  @IsOptional()
  @IsString()
  readonly identifierValue?: string;
}
