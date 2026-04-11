import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { WarehouseAlreadyExistsError } from '../../domain/errors/warehouse-already-exists.error';
import { WAREHOUSE_REPOSITORY } from '../../domain/ports/warehouse.repository.port';
import type { WarehouseRepository } from '../../domain/ports/warehouse.repository.port';
import { CreateWarehouseCommand } from '../commands/create-warehouse.command';

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: WarehouseRepository,
  ) {}

  async execute(command: CreateWarehouseCommand): Promise<Warehouse> {
    const existingWarehouse = await this.warehouseRepository.findByCode(command.code);

    if (existingWarehouse !== null) {
      throw new WarehouseAlreadyExistsError(command.code);
    }

    const warehouse = Warehouse.create({
      id: createWarehouseId(),
      code: command.code,
      name: command.name,
      processingTimeDays: command.processingTimeDays,
    });

    await this.warehouseRepository.save(warehouse);

    return warehouse;
  }
}

function createWarehouseId(): string {
  return `wh_${randomUUID().replace(/-/g, '')}`;
}
