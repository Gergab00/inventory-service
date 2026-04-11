import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExternalIdentifierRequestDto } from './create-product.request.dto';

export class UpdateProductRequestDto {
  @ApiPropertyOptional({ example: 'Nintendo Switch OLED White' })
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

  @ApiPropertyOptional({ type: [ExternalIdentifierRequestDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalIdentifierRequestDto)
  readonly externalIdentifiers?: ExternalIdentifierRequestDto[];

  @ApiPropertyOptional({ example: { color: 'White' } })
  @IsOptional()
  @IsObject()
  readonly attributes?: Record<string, string>;
}
