import { Inject, Injectable } from '@nestjs/common';
import { Collection, Db, type Document, type Filter } from 'mongodb';
import { MONGO_DATABASE } from '../../../../infrastructure/persistence/mongodb/mongodb.tokens';
import { Warehouse, WarehousePrimitives } from '../../domain/entities/warehouse.entity';
import type {
  ListWarehousesFilters,
  PaginatedWarehousesResult,
  WarehouseRepository,
} from '../../domain/ports/warehouse.repository.port';

interface WarehouseDocument extends Document, WarehousePrimitives {
  codeNormalized: string;
  nameNormalized: string;
}

@Injectable()
export class MongoWarehouseRepository implements WarehouseRepository {
  constructor(@Inject(MONGO_DATABASE) private readonly database: Db) {}

  async save(warehouse: Warehouse): Promise<void> {
    const primitives = warehouse.toPrimitives();

    const document: WarehouseDocument = {
      ...primitives,
      codeNormalized: normalize(primitives.code),
      nameNormalized: normalize(primitives.name),
    };

    await this.getCollection().updateOne(
      { id: primitives.id },
      { $set: document },
      { upsert: true },
    );
  }

  async findById(warehouseId: string): Promise<Warehouse | null> {
    const document = await this.getCollection().findOne({ id: warehouseId });

    return document === null ? null : Warehouse.reconstitute(toPrimitives(document));
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    const document = await this.getCollection().findOne({
      codeNormalized: normalize(code),
    });

    return document === null ? null : Warehouse.reconstitute(toPrimitives(document));
  }

  async findAll(
    filters: ListWarehousesFilters,
  ): Promise<PaginatedWarehousesResult> {
    const page = Math.max(filters.page, 1);
    const pageSize = Math.max(filters.pageSize, 1);
    const query = buildQuery(filters);

    const total = await this.getCollection().countDocuments(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    const documents = await this.getCollection()
      .find(query)
      .sort({ createdAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return {
      items: documents.map((document) => Warehouse.reconstitute(toPrimitives(document))),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  private getCollection(): Collection<WarehouseDocument> {
    return this.database.collection<WarehouseDocument>('warehouses');
  }
}

function toPrimitives(document: WarehouseDocument): WarehousePrimitives {
  return {
    id: document.id,
    code: document.code,
    name: document.name,
    processingTimeDays: document.processingTimeDays,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function buildQuery(filters: ListWarehousesFilters): Filter<WarehouseDocument> {
  const query: Filter<WarehouseDocument> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.code) {
    query.codeNormalized = {
      $regex: escapeRegExp(normalize(filters.code)),
    };
  }

  if (filters.name) {
    query.nameNormalized = {
      $regex: escapeRegExp(normalize(filters.name)),
    };
  }

  return query;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
