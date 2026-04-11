import { Inject, Injectable } from '@nestjs/common';
import { WAREHOUSE_REPOSITORY } from '../../domain/ports/warehouse.repository.port';
import type {
  ListWarehousesFilters,
  PaginatedWarehousesResult,
  WarehouseRepository,
} from '../../domain/ports/warehouse.repository.port';

@Injectable()
export class ListWarehousesUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository,
  ) {}

  execute(query: ListWarehousesFilters): Promise<PaginatedWarehousesResult> {
    return this.warehouseRepository.findAll(query);
  }
}
