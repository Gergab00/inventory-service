import { ApiProperty } from '@nestjs/swagger';
import {
  PaginationMetaDto,
  RequestMetaDto,
} from '../../../../products/interfaces/http/dto/product.response.dto';

export class MoneyResponseDto {
  @ApiProperty({ example: 9500 })
  readonly amount!: number;

  @ApiProperty({ example: 'MXN' })
  readonly currency!: string;
}

export class SourceReferenceResponseDto {
  @ApiProperty({ example: 'purchase-order' })
  readonly type!: string;

  @ApiProperty({ example: 'PO-001' })
  readonly id!: string;
}

export class InventoryReferenceResponseDto {
  @ApiProperty({ example: 'order' })
  readonly type!: string;

  @ApiProperty({ example: 'ORD-01' })
  readonly id!: string;
}

export class InventoryLotResponseDto {
  @ApiProperty({ example: 'lot_01JX9XDB9T3B4V6W7Y8Z1A2B3C' })
  readonly lotId!: string;

  @ApiProperty({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  readonly productId!: string;

  @ApiProperty({ example: 'wh_01JX9XB92E4S9P3Q8T6N1R5M7K' })
  readonly warehouseId!: string;

  @ApiProperty({ example: 10 })
  readonly originalQuantity!: number;

  @ApiProperty({ example: 6 })
  readonly availableQuantity!: number;

  @ApiProperty({ type: MoneyResponseDto })
  readonly unitCost!: MoneyResponseDto;

  @ApiProperty({ type: SourceReferenceResponseDto })
  readonly sourceReference!: SourceReferenceResponseDto;

  @ApiProperty({ example: '2026-04-10T16:00:00.000Z' })
  readonly createdAt!: string;

  @ApiProperty({ enum: ['active', 'depleted'] })
  readonly status!: 'active' | 'depleted';
}

export class InventoryMovementResponseDto {
  @ApiProperty({ example: 'mov_01JX9XDB9T3B4V6W7Y8Z1A2B3C' })
  readonly movementId!: string;

  @ApiProperty({ enum: ['entry', 'exit', 'adjustment'] })
  readonly type!: 'entry' | 'exit' | 'adjustment';

  @ApiProperty({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  readonly productId!: string;

  @ApiProperty({ example: 'wh_01JX9XB92E4S9P3Q8T6N1R5M7K' })
  readonly warehouseId!: string;

  @ApiProperty({ example: 10 })
  readonly quantity!: number;

  @ApiProperty({ type: MoneyResponseDto, required: false })
  readonly unitCost?: MoneyResponseDto;

  @ApiProperty({ type: SourceReferenceResponseDto, required: false })
  readonly sourceReference?: SourceReferenceResponseDto;

  @ApiProperty({ type: InventoryReferenceResponseDto, required: false })
  readonly reference?: InventoryReferenceResponseDto;

  @ApiProperty({ type: [String] })
  readonly affectedLotIds!: string[];

  @ApiProperty({ example: '2026-04-10T16:00:00.000Z' })
  readonly occurredAt!: string;
}

export class InventoryMovementEnvelopeResponseDto {
  @ApiProperty({ type: InventoryMovementResponseDto })
  readonly data!: InventoryMovementResponseDto;

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}

export class InventoryLotEnvelopeResponseDto {
  @ApiProperty({ type: InventoryLotResponseDto })
  readonly data!: InventoryLotResponseDto;

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}

export class InventoryLotListResponseDto {
  @ApiProperty({ type: [InventoryLotResponseDto] })
  readonly data!: InventoryLotResponseDto[];

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}

export class InventoryMovementListMetaDto extends RequestMetaDto {
  @ApiProperty({ type: PaginationMetaDto })
  readonly pagination!: PaginationMetaDto;
}

export class InventoryMovementListResponseDto {
  @ApiProperty({ type: [InventoryMovementResponseDto] })
  readonly data!: InventoryMovementResponseDto[];

  @ApiProperty({ type: InventoryMovementListMetaDto })
  readonly meta!: InventoryMovementListMetaDto;
}

export class InventoryAvailabilityWarehouseDto {
  @ApiProperty({ example: 'wh_01JX9XB92E4S9P3Q8T6N1R5M7K' })
  readonly warehouseId!: string;

  @ApiProperty({ example: 6 })
  readonly availableQuantity!: number;

  @ApiProperty({ example: 2 })
  readonly processingTimeDays!: number;
}

export class ProductInventoryAvailabilityDataDto {
  @ApiProperty({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  readonly productId!: string;

  @ApiProperty({ example: 6 })
  readonly totalAvailableQuantity!: number;

  @ApiProperty({ type: [InventoryAvailabilityWarehouseDto] })
  readonly warehouses!: InventoryAvailabilityWarehouseDto[];
}

export class ProductInventoryAvailabilityResponseDto {
  @ApiProperty({ type: ProductInventoryAvailabilityDataDto })
  readonly data!: ProductInventoryAvailabilityDataDto;

  @ApiProperty({ type: RequestMetaDto })
  readonly meta!: RequestMetaDto;
}
