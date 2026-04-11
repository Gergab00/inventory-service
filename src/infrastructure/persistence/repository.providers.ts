import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INVENTORY_UNIT_OF_WORK } from '../../modules/inventory/application/ports/inventory-unit-of-work.port';
import type { DatabaseType, EnvironmentVariables } from '../config/environment-variables';
import {
  INVENTORY_LOT_REPOSITORY,
  INVENTORY_MOVEMENT_REPOSITORY,
} from '../../modules/inventory/domain/ports/inventory.repository.port';
import type {
  InventoryLotRepository,
  InventoryMovementRepository,
} from '../../modules/inventory/domain/ports/inventory.repository.port';
import { InMemoryInventoryRepository } from '../../modules/inventory/infrastructure/repositories/in-memory-inventory.repository';
import { NoopInventoryUnitOfWork } from '../../modules/inventory/infrastructure/unit-of-work/noop-inventory-unit-of-work';
import { PRODUCT_REPOSITORY } from '../../modules/products/domain/ports/product.repository.port';
import type { ProductRepository } from '../../modules/products/domain/ports/product.repository.port';
import { InMemoryProductRepository } from '../../modules/products/infrastructure/repositories/in-memory-product.repository';
import { WAREHOUSE_REPOSITORY } from '../../modules/warehouses/domain/ports/warehouse.repository.port';
import type { WarehouseRepository } from '../../modules/warehouses/domain/ports/warehouse.repository.port';
import { InMemoryWarehouseRepository } from '../../modules/warehouses/infrastructure/repositories/in-memory-warehouse.repository';
import { resolvePersistenceAdapter } from './adapter.resolver';

export const productPersistenceProviders: Provider[] = [
  InMemoryProductRepository,
  {
    provide: PRODUCT_REPOSITORY,
    inject: [ConfigService, InMemoryProductRepository],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      inMemoryProductRepository: InMemoryProductRepository,
    ): ProductRepository =>
      resolvePersistenceAdapter({
        adapterName: 'ProductRepository',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter: inMemoryProductRepository,
      }),
  },
];

export const warehousePersistenceProviders: Provider[] = [
  InMemoryWarehouseRepository,
  {
    provide: WAREHOUSE_REPOSITORY,
    inject: [ConfigService, InMemoryWarehouseRepository],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      inMemoryWarehouseRepository: InMemoryWarehouseRepository,
    ): WarehouseRepository =>
      resolvePersistenceAdapter({
        adapterName: 'WarehouseRepository',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter: inMemoryWarehouseRepository,
      }),
  },
];

export const inventoryPersistenceProviders: Provider[] = [
  InMemoryInventoryRepository,
  NoopInventoryUnitOfWork,
  {
    provide: INVENTORY_LOT_REPOSITORY,
    inject: [ConfigService, InMemoryInventoryRepository],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      inMemoryInventoryRepository: InMemoryInventoryRepository,
    ): InventoryLotRepository =>
      resolvePersistenceAdapter({
        adapterName: 'InventoryLotRepository',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter: inMemoryInventoryRepository,
      }),
  },
  {
    provide: INVENTORY_MOVEMENT_REPOSITORY,
    inject: [ConfigService, InMemoryInventoryRepository],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      inMemoryInventoryRepository: InMemoryInventoryRepository,
    ): InventoryMovementRepository =>
      resolvePersistenceAdapter({
        adapterName: 'InventoryMovementRepository',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter: inMemoryInventoryRepository,
      }),
  },
  {
    provide: INVENTORY_UNIT_OF_WORK,
    useExisting: NoopInventoryUnitOfWork,
  },
];

function getDatabaseType(
  configService: ConfigService<EnvironmentVariables, true>,
): DatabaseType {
  return configService.getOrThrow<DatabaseType>('DATABASE_TYPE');
}
