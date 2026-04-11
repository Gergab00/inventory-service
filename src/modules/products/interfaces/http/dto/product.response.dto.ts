import { ApiProperty } from '@nestjs/swagger';

export class RequestMetaDto {
  @ApiProperty({ example: 'req_2f3bb1f1a0f8' })
  readonly requestId!: string;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  readonly page!: number;

  @ApiProperty({ example: 20 })
  readonly pageSize!: number;

  @ApiProperty({ example: 1 })
  readonly total!: number;

  @ApiProperty({ example: 1 })
  readonly totalPages!: number;
}

export class ExternalIdentifierResponseDto {
  @ApiProperty({ example: 'asin' })
  readonly type!: string;

  @ApiProperty({ example: 'B07TWW67JS' })
  readonly value!: string;

  @ApiProperty({ example: 'sp-amz-backend', required: false })
  readonly provider?: string;

  @ApiProperty({ example: 'A1AM78C64UM0Y8', required: false })
  readonly marketplaceId?: string;
}

export class ProductImageReferenceResponseDto {
  @ApiProperty({ example: 'imgref_01JX9X8Q0A2B3C4D5E6F7G8H9' })
  readonly id!: string;

  @ApiProperty({ example: 'https://cdn.example.com/image-1.jpg' })
  readonly url!: string;

  @ApiProperty({ example: 'primary' })
  readonly role!: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  readonly id!: string;

  @ApiProperty({ example: 'Nintendo Switch OLED' })
  readonly title!: string;

  @ApiProperty({ example: 'Nintendo' })
  readonly brand!: string;

  @ApiProperty({ enum: ['active', 'inactive'] })
  readonly status!: 'active' | 'inactive';

  @ApiProperty({ type: [ExternalIdentifierResponseDto] })
  readonly externalIdentifiers!: ExternalIdentifierResponseDto[];

  @ApiProperty({ example: { color: 'White' } })
  readonly attributes!: Record<string, string>;

  @ApiProperty({ type: [ProductImageReferenceResponseDto] })
  readonly imageReferences!: ProductImageReferenceResponseDto[];

  @ApiProperty({ example: '2026-04-10T16:00:00.000Z' })
  readonly createdAt!: string;

  @ApiProperty({ example: '2026-04-10T16:05:00.000Z' })
  readonly updatedAt!: string;
}

export class CreateResourceDataDto {
  @ApiProperty({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  readonly id!: string;
}

export class CreateProductResponseDto {
  @ApiProperty({ type: CreateResourceDataDto })
  readonly data!: CreateResourceDataDto;

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}

export class ProductEnvelopeResponseDto {
  @ApiProperty({ type: ProductResponseDto })
  readonly data!: ProductResponseDto;

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}

export class ProductImageReferenceListResponseDto {
  @ApiProperty({ type: [ProductImageReferenceResponseDto] })
  readonly data!: ProductImageReferenceResponseDto[];

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}

export class ProductListMetaDto extends RequestMetaDto {
  @ApiProperty({ type: PaginationMetaDto })
  readonly pagination!: PaginationMetaDto;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  readonly data!: ProductResponseDto[];

  @ApiProperty({ type: ProductListMetaDto })
  readonly meta!: ProductListMetaDto;
}
