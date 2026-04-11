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
import { MongoInventoryRepository } from '../../modules/inventory/infrastructure/repositories/mongo-inventory.repository';
import { MongoInventoryUnitOfWork } from '../../modules/inventory/infrastructure/unit-of-work/mongo-inventory-unit-of-work';
import { NoopInventoryUnitOfWork } from '../../modules/inventory/infrastructure/unit-of-work/noop-inventory-unit-of-work';
import { PRODUCT_REPOSITORY } from '../../modules/products/domain/ports/product.repository.port';
import type { ProductRepository } from '../../modules/products/domain/ports/product.repository.port';
import { InMemoryProductRepository } from '../../modules/products/infrastructure/repositories/in-memory-product.repository';
import { MongoProductRepository } from '../../modules/products/infrastructure/repositories/mongo-product.repository';
import { WAREHOUSE_REPOSITORY } from '../../modules/warehouses/domain/ports/warehouse.repository.port';
import type { WarehouseRepository } from '../../modules/warehouses/domain/ports/warehouse.repository.port';
import { InMemoryWarehouseRepository } from '../../modules/warehouses/infrastructure/repositories/in-memory-warehouse.repository';
import { MongoWarehouseRepository } from '../../modules/warehouses/infrastructure/repositories/mongo-warehouse.repository';
import { resolvePersistenceAdapter } from './adapter.resolver';

export const productPersistenceProviders: Provider[] = [
  InMemoryProductRepository,
  MongoProductRepository,
  {
    provide: PRODUCT_REPOSITORY,
    inject: [ConfigService, InMemoryProductRepository, MongoProductRepository],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      inMemoryProductRepository: InMemoryProductRepository,
      mongoProductRepository: MongoProductRepository,
    ): ProductRepository => {
      const inMemoryAdapter: ProductRepository = inMemoryProductRepository;
      const mongodbAdapter: ProductRepository = mongoProductRepository;

      return resolvePersistenceAdapter<ProductRepository>({
        adapterName: 'ProductRepository',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter,
        mongodbAdapter,
      });
    },
  },
];

export const warehousePersistenceProviders: Provider[] = [
  InMemoryWarehouseRepository,
  MongoWarehouseRepository,
  {
    provide: WAREHOUSE_REPOSITORY,
    inject: [ConfigService, InMemoryWarehouseRepository, MongoWarehouseRepository],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      inMemoryWarehouseRepository: InMemoryWarehouseRepository,
      mongoWarehouseRepository: MongoWarehouseRepository,
    ): WarehouseRepository => {
      const inMemoryAdapter: WarehouseRepository = inMemoryWarehouseRepository;
      const mongodbAdapter: WarehouseRepository = mongoWarehouseRepository;

      return resolvePersistenceAdapter<WarehouseRepository>({
        adapterName: 'WarehouseRepository',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter,
        mongodbAdapter,
      });
    },
  },
];

export const inventoryPersistenceProviders: Provider[] = [
  InMemoryInventoryRepository,
  MongoInventoryRepository,
  NoopInventoryUnitOfWork,
  MongoInventoryUnitOfWork,
  {
    provide: INVENTORY_LOT_REPOSITORY,
    inject: [ConfigService, InMemoryInventoryRepository, MongoInventoryRepository],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      inMemoryInventoryRepository: InMemoryInventoryRepository,
      mongoInventoryRepository: MongoInventoryRepository,
    ): InventoryLotRepository => {
      const inMemoryAdapter: InventoryLotRepository = inMemoryInventoryRepository;
      const mongodbAdapter: InventoryLotRepository = mongoInventoryRepository;

      return resolvePersistenceAdapter<InventoryLotRepository>({
        adapterName: 'InventoryLotRepository',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter,
        mongodbAdapter,
      });
    },
  },
  {
    provide: INVENTORY_MOVEMENT_REPOSITORY,
    inject: [ConfigService, InMemoryInventoryRepository, MongoInventoryRepository],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      inMemoryInventoryRepository: InMemoryInventoryRepository,
      mongoInventoryRepository: MongoInventoryRepository,
    ): InventoryMovementRepository => {
      const inMemoryAdapter: InventoryMovementRepository =
        inMemoryInventoryRepository;
      const mongodbAdapter: InventoryMovementRepository = mongoInventoryRepository;

      return resolvePersistenceAdapter<InventoryMovementRepository>({
        adapterName: 'InventoryMovementRepository',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter,
        mongodbAdapter,
      });
    },
  },
  {
    provide: INVENTORY_UNIT_OF_WORK,
    inject: [
      ConfigService,
      NoopInventoryUnitOfWork,
      MongoInventoryUnitOfWork,
    ],
    useFactory: (
      configService: ConfigService<EnvironmentVariables, true>,
      noopInventoryUnitOfWork: NoopInventoryUnitOfWork,
      mongoInventoryUnitOfWork: MongoInventoryUnitOfWork,
    ) =>
      resolvePersistenceAdapter({
        adapterName: 'InventoryUnitOfWork',
        databaseType: getDatabaseType(configService),
        inMemoryAdapter: noopInventoryUnitOfWork,
        mongodbAdapter: mongoInventoryUnitOfWork,
      }),
  },
];

function getDatabaseType(
  configService: ConfigService<EnvironmentVariables, true>,
): DatabaseType {
  return configService.getOrThrow<DatabaseType>('DATABASE_TYPE');
}
