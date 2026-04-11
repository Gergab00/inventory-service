import { Inject, Injectable } from '@nestjs/common';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { WAREHOUSE_REPOSITORY } from '../../domain/ports/warehouse.repository.port';
import type { WarehouseRepository } from '../../domain/ports/warehouse.repository.port';

@Injectable()
export class SoftDeleteWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository,
  ) {}

  async execute(warehouseId: string): Promise<Warehouse | null> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);

    if (warehouse === null) {
      return null;
    }

    warehouse.deactivate();
    await this.warehouseRepository.save(warehouse);

    return warehouse;
  }
}
