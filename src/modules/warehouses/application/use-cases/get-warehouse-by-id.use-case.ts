import { Inject, Injectable } from '@nestjs/common';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { WAREHOUSE_REPOSITORY } from '../../domain/ports/warehouse.repository.port';
import type { WarehouseRepository } from '../../domain/ports/warehouse.repository.port';

@Injectable()
export class GetWarehouseByIdUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository,
  ) {}

  execute(warehouseId: string): Promise<Warehouse | null> {
    return this.warehouseRepository.findById(warehouseId);
  }
}
