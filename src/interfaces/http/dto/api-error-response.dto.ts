import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorDetailDto {
  @ApiProperty({ example: 'PRODUCT_NOT_FOUND' })
  code!: string;

  @ApiProperty({ example: 'El producto solicitado no existe.' })
  message!: string;

  @ApiProperty({
    description: 'Detalles adicionales del error cuando aplique.',
    example: [{ productId: 'prd_missing' }],
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: true,
    },
  })
  details!: Array<Record<string, unknown>>;
}

export class ApiErrorMetaDto {
  @ApiProperty({ example: 'req_a1b2c3d4e5f6' })
  requestId!: string;

  @ApiProperty({ example: '2026-04-10T18:30:00.000Z' })
  timestamp!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ type: ApiErrorDetailDto })
  error!: ApiErrorDetailDto;

  @ApiProperty({ type: ApiErrorMetaDto })
  meta!: ApiErrorMetaDto;
}
