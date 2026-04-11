import { Warehouse, WarehouseStatus } from '../entities/warehouse.entity';

export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');

export interface ListWarehousesFilters {
  readonly page: number;
  readonly pageSize: number;
  readonly code?: string;
  readonly name?: string;
  readonly status?: WarehouseStatus;
}

export interface PaginatedWarehousesResult {
  readonly items: Warehouse[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface WarehouseRepository {
  save(warehouse: Warehouse): Promise<void>;
  findById(warehouseId: string): Promise<Warehouse | null>;
  findByCode(code: string): Promise<Warehouse | null>;
  findAll(filters: ListWarehousesFilters): Promise<PaginatedWarehousesResult>;
}
