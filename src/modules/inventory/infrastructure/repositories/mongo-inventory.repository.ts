import { Inject, Injectable } from '@nestjs/common';
import {
  Collection,
  Db,
  Document,
  type ClientSession,
  type Filter,
  type OptionalUnlessRequiredId,
} from 'mongodb';
import { MONGO_DATABASE } from '../../../../infrastructure/persistence/mongodb/mongodb.tokens';
import { MongoSessionContext } from '../../../../infrastructure/persistence/mongodb/mongodb-session.context';
import { InventoryLot, InventoryLotPrimitives } from '../../domain/entities/inventory-lot.entity';
import {
  InventoryMovement,
  InventoryMovementPrimitives,
} from '../../domain/entities/inventory-movement.entity';
import type {
  InventoryLotRepository,
  InventoryMovementRepository,
  ListInventoryMovementsFilters,
  PaginatedInventoryMovementsResult,
} from '../../domain/ports/inventory.repository.port';

interface InventoryLotDocument extends Document, InventoryLotPrimitives {}
interface InventoryMovementDocument extends Document, InventoryMovementPrimitives {}

@Injectable()
export class MongoInventoryRepository
  implements InventoryLotRepository, InventoryMovementRepository
{
  constructor(
    @Inject(MONGO_DATABASE) private readonly database: Db,
    private readonly mongoSessionContext: MongoSessionContext,
  ) {}

  async save(lotOrMovement: InventoryLot | InventoryMovement): Promise<void> {
    if (lotOrMovement instanceof InventoryLot) {
      const primitives = lotOrMovement.toPrimitives();

      await this.getLotCollection().updateOne(
        { lotId: primitives.lotId },
        { $set: toLotDocument(primitives) },
        { upsert: true, session: this.getCurrentSession() },
      );

      return;
    }

    const primitives = lotOrMovement.toPrimitives();

    await this.getMovementCollection().updateOne(
      { movementId: primitives.movementId },
      { $set: toMovementDocument(primitives) },
      { upsert: true, session: this.getCurrentSession() },
    );
  }

  async findById(lotId: string): Promise<InventoryLot | null> {
    const document = await this.getLotCollection().findOne(
      { lotId },
      { session: this.getCurrentSession() },
    );

    return document === null ? null : InventoryLot.reconstitute(toLotPrimitives(document));
  }

  async findByProductId(productId: string): Promise<InventoryLot[]> {
    const documents = await this.getLotCollection()
      .find({ productId }, { session: this.getCurrentSession() })
      .sort({ createdAt: 1 })
      .toArray();

    return documents.map((document) => InventoryLot.reconstitute(toLotPrimitives(document)));
  }

  async findAvailableByProductAndWarehouse(
    productId: string,
    warehouseId: string,
  ): Promise<InventoryLot[]> {
    const documents = await this.getLotCollection()
      .find(
        {
          productId,
          warehouseId,
          availableQuantity: { $gt: 0 },
        },
        { session: this.getCurrentSession() },
      )
      .sort({ createdAt: 1 })
      .toArray();

    return documents.map((document) => InventoryLot.reconstitute(toLotPrimitives(document)));
  }

  async findAll(
    filters: ListInventoryMovementsFilters,
  ): Promise<PaginatedInventoryMovementsResult> {
    const page = Math.max(filters.page, 1);
    const pageSize = Math.max(filters.pageSize, 1);
    const query = buildMovementQuery(filters);

    const total = await this.getMovementCollection().countDocuments(query, {
      session: this.getCurrentSession(),
    });
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    const documents = await this.getMovementCollection()
      .find(query, { session: this.getCurrentSession() })
      .sort({ occurredAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return {
      items: documents.map((document) =>
        InventoryMovement.reconstitute(toMovementPrimitives(document)),
      ),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  private getLotCollection(): Collection<InventoryLotDocument> {
    return this.database.collection<InventoryLotDocument>('inventory_lots');
  }

  private getMovementCollection(): Collection<InventoryMovementDocument> {
    return this.database.collection<InventoryMovementDocument>('inventory_movements');
  }

  private getCurrentSession(): ClientSession | undefined {
    return this.mongoSessionContext.getCurrentSession();
  }
}

function toLotDocument(
  primitives: InventoryLotPrimitives,
): OptionalUnlessRequiredId<InventoryLotDocument> {
  return {
    ...primitives,
    unitCost: { ...primitives.unitCost },
    sourceReference: { ...primitives.sourceReference },
  };
}

function toLotPrimitives(document: InventoryLotDocument): InventoryLotPrimitives {
  return {
    lotId: document.lotId,
    productId: document.productId,
    warehouseId: document.warehouseId,
    originalQuantity: document.originalQuantity,
    availableQuantity: document.availableQuantity,
    unitCost: {
      amount: document.unitCost.amount,
      currency: document.unitCost.currency,
    },
    sourceReference: {
      type: document.sourceReference.type,
      id: document.sourceReference.id,
    },
    createdAt: document.createdAt,
    status: document.status,
  };
}

function toMovementDocument(
  primitives: InventoryMovementPrimitives,
): OptionalUnlessRequiredId<InventoryMovementDocument> {
  return {
    ...primitives,
    unitCost: primitives.unitCost ? { ...primitives.unitCost } : undefined,
    sourceReference: primitives.sourceReference
      ? { ...primitives.sourceReference }
      : undefined,
    reference: primitives.reference ? { ...primitives.reference } : undefined,
    affectedLotIds: [...primitives.affectedLotIds],
  };
}

function toMovementPrimitives(
  document: InventoryMovementDocument,
): InventoryMovementPrimitives {
  return {
    movementId: document.movementId,
    type: document.type,
    productId: document.productId,
    warehouseId: document.warehouseId,
    quantity: document.quantity,
    unitCost: document.unitCost
      ? {
          amount: document.unitCost.amount,
          currency: document.unitCost.currency,
        }
      : undefined,
    sourceReference: document.sourceReference
      ? {
          type: document.sourceReference.type,
          id: document.sourceReference.id,
        }
      : undefined,
    reference: document.reference
      ? {
          type: document.reference.type,
          id: document.reference.id,
        }
      : undefined,
    affectedLotIds: [...document.affectedLotIds],
    occurredAt: document.occurredAt,
  };
}

function buildMovementQuery(
  filters: ListInventoryMovementsFilters,
): Filter<InventoryMovementDocument> {
  const query: Filter<InventoryMovementDocument> = {};

  if (filters.productId) {
    query.productId = filters.productId;
  }

  if (filters.warehouseId) {
    query.warehouseId = filters.warehouseId;
  }

  if (filters.type) {
    query.type = filters.type;
  }

  return query;
}
