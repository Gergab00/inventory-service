import { ApiProperty } from '@nestjs/swagger';
import {
  CreateResourceDataDto,
  CreateProductResponseDto,
  PaginationMetaDto,
  RequestMetaDto,
} from '../../../../products/interfaces/http/dto/product.response.dto';

export class WarehouseResponseDto {
  @ApiProperty({ example: 'wh_01JX9XB92E4S9P3Q8T6N1R5M7K' })
  readonly id!: string;

  @ApiProperty({ example: 'CDMX-01' })
  readonly code!: string;

  @ApiProperty({ example: 'Almacén CDMX' })
  readonly name!: string;

  @ApiProperty({ example: 1 })
  readonly processingTimeDays!: number;

  @ApiProperty({ enum: ['active', 'inactive'] })
  readonly status!: 'active' | 'inactive';

  @ApiProperty({ example: '2026-04-10T16:00:00.000Z' })
  readonly createdAt!: string;

  @ApiProperty({ example: '2026-04-10T16:05:00.000Z' })
  readonly updatedAt!: string;
}

export class CreateWarehouseResponseDto {
  @ApiProperty({ type: CreateResourceDataDto })
  readonly data!: CreateResourceDataDto;

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}

export class WarehouseEnvelopeResponseDto {
  @ApiProperty({ type: WarehouseResponseDto })
  readonly data!: WarehouseResponseDto;

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}

export class WarehouseListMetaDto extends RequestMetaDto {
  @ApiProperty({ type: PaginationMetaDto })
  readonly pagination!: PaginationMetaDto;
}

export class WarehouseListResponseDto {
  @ApiProperty({ type: [WarehouseResponseDto] })
  readonly data!: WarehouseResponseDto[];

  @ApiProperty({ type: WarehouseListMetaDto })
  readonly meta!: WarehouseListMetaDto;
}
