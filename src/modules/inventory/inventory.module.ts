import { Module } from '@nestjs/common';
import { inventoryPersistenceProviders } from '../../infrastructure/persistence/repository.providers';
import { ProductsModule } from '../products/products.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { GetInventoryLotByIdUseCase } from './application/use-cases/get-inventory-lot-by-id.use-case';
import { GetProductInventoryAvailabilityUseCase } from './application/use-cases/get-product-inventory-availability.use-case';
import { GetProductInventoryLotsUseCase } from './application/use-cases/get-product-inventory-lots.use-case';
import { ListInventoryMovementsUseCase } from './application/use-cases/list-inventory-movements.use-case';
import { RegisterInventoryAdjustmentUseCase } from './application/use-cases/register-inventory-adjustment.use-case';
import { RegisterInventoryEntryUseCase } from './application/use-cases/register-inventory-entry.use-case';
import { RegisterInventoryExitUseCase } from './application/use-cases/register-inventory-exit.use-case';
import { InventoryController } from './interfaces/http/inventory.controller';

@Module({
  imports: [ProductsModule, WarehousesModule],
  controllers: [InventoryController],
  providers: [
    RegisterInventoryEntryUseCase,
    RegisterInventoryExitUseCase,
    RegisterInventoryAdjustmentUseCase,
    GetInventoryLotByIdUseCase,
    GetProductInventoryLotsUseCase,
    GetProductInventoryAvailabilityUseCase,
    ListInventoryMovementsUseCase,
    ...inventoryPersistenceProviders,
  ],
})
export class InventoryModule {}
