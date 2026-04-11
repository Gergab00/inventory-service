import { WarehouseStatus } from '../../domain/entities/warehouse.entity';

export interface UpdateWarehouseCommand {
  readonly warehouseId: string;
  readonly code?: string;
  readonly name?: string;
  readonly processingTimeDays?: number;
  readonly status?: WarehouseStatus;
}
