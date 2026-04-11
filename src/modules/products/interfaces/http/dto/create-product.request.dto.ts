import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExternalIdentifierRequestDto {
  @ApiProperty({ example: 'asin' })
  @IsString()
  @IsNotEmpty()
  readonly type!: string;

  @ApiProperty({ example: 'B07TWW67JS' })
  @IsString()
  @IsNotEmpty()
  readonly value!: string;

  @ApiPropertyOptional({ example: 'sp-amz-backend' })
  @IsOptional()
  @IsString()
  readonly provider?: string;

  @ApiPropertyOptional({ example: 'A1AM78C64UM0Y8' })
  @IsOptional()
  @IsString()
  readonly marketplaceId?: string;
}

export class CreateProductRequestDto {
  @ApiProperty({ example: 'Nintendo Switch OLED' })
  @IsString()
  @IsNotEmpty()
  readonly title!: string;

  @ApiProperty({ example: 'Nintendo' })
  @IsString()
  @IsNotEmpty()
  readonly brand!: string;

  @ApiPropertyOptional({ type: [ExternalIdentifierRequestDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalIdentifierRequestDto)
  readonly externalIdentifiers?: ExternalIdentifierRequestDto[];

  @ApiPropertyOptional({
    example: {
      color: 'White',
    },
  })
  @IsOptional()
  @IsObject()
  readonly attributes?: Record<string, string>;
}
