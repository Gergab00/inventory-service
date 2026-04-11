import { Inject, Injectable } from '@nestjs/common';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { WAREHOUSE_REPOSITORY } from '../../domain/ports/warehouse.repository.port';
import type { WarehouseRepository } from '../../domain/ports/warehouse.repository.port';
import { UpdateWarehouseCommand } from '../commands/update-warehouse.command';

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository,
  ) {}

  async execute(command: UpdateWarehouseCommand): Promise<Warehouse | null> {
    const warehouse = await this.warehouseRepository.findById(command.warehouseId);

    if (warehouse === null) {
      return null;
    }

    warehouse.update({
      code: command.code,
      name: command.name,
      processingTimeDays: command.processingTimeDays,
      status: command.status,
    });

    await this.warehouseRepository.save(warehouse);

    return warehouse;
  }
}
