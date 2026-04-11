import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/environment-variables';
import { MongoConnectionService } from './mongo-connection.service';

@Injectable()
export class MongoIndexesInitializer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly mongoConnectionService: MongoConnectionService,
  ) {}

  async onModuleInit(): Promise<void> {
    const databaseType = this.configService.getOrThrow('DATABASE_TYPE');

    if (databaseType !== 'mongodb') {
      return;
    }

    const database = this.mongoConnectionService.getDatabase();

    await Promise.all([
      database.collection('products').createIndexes([
        { key: { id: 1 }, name: 'products_id_unique', unique: true },
        {
          key: {
            'externalIdentifiers.typeNormalized': 1,
            'externalIdentifiers.valueNormalized': 1,
          },
          name: 'products_external_identifier_lookup',
        },
        { key: { titleNormalized: 1 }, name: 'products_title_normalized' },
        { key: { brandNormalized: 1 }, name: 'products_brand_normalized' },
        { key: { createdAt: 1 }, name: 'products_created_at' },
      ]),
      database.collection('warehouses').createIndexes([
        { key: { id: 1 }, name: 'warehouses_id_unique', unique: true },
        {
          key: { codeNormalized: 1 },
          name: 'warehouses_code_normalized_unique',
          unique: true,
        },
        { key: { nameNormalized: 1 }, name: 'warehouses_name_normalized' },
        { key: { createdAt: 1 }, name: 'warehouses_created_at' },
      ]),
      database.collection('inventory_lots').createIndexes([
        { key: { lotId: 1 }, name: 'inventory_lots_lot_id_unique', unique: true },
        {
          key: { productId: 1, warehouseId: 1, createdAt: 1 },
          name: 'inventory_lots_fifo_lookup',
        },
        { key: { status: 1 }, name: 'inventory_lots_status' },
      ]),
      database.collection('inventory_movements').createIndexes([
        {
          key: { movementId: 1 },
          name: 'inventory_movements_movement_id_unique',
          unique: true,
        },
        {
          key: { productId: 1, warehouseId: 1, occurredAt: 1 },
          name: 'inventory_movements_lookup',
        },
        {
          key: { type: 1, occurredAt: 1 },
          name: 'inventory_movements_type_occurred_at',
        },
      ]),
    ]);
  }
}
