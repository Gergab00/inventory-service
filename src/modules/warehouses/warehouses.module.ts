import { Module } from '@nestjs/common';
import { CreateWarehouseUseCase } from './application/use-cases/create-warehouse.use-case';
import { GetWarehouseByIdUseCase } from './application/use-cases/get-warehouse-by-id.use-case';
import { ListWarehousesUseCase } from './application/use-cases/list-warehouses.use-case';
import { SoftDeleteWarehouseUseCase } from './application/use-cases/soft-delete-warehouse.use-case';
import { UpdateWarehouseUseCase } from './application/use-cases/update-warehouse.use-case';
import { WAREHOUSE_REPOSITORY } from './domain/ports/warehouse.repository.port';
import { InMemoryWarehouseRepository } from './infrastructure/repositories/in-memory-warehouse.repository';
import { WarehousesController } from './interfaces/http/warehouses.controller';

@Module({
  controllers: [WarehousesController],
  providers: [
    CreateWarehouseUseCase,
    GetWarehouseByIdUseCase,
    ListWarehousesUseCase,
    UpdateWarehouseUseCase,
    SoftDeleteWarehouseUseCase,
    InMemoryWarehouseRepository,
    {
      provide: WAREHOUSE_REPOSITORY,
      useExisting: InMemoryWarehouseRepository,
    },
  ],
})
export class WarehousesModule {}
