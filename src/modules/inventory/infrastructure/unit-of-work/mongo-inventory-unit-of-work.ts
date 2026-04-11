import { Inject, Injectable } from '@nestjs/common';
import type { MongoClient } from 'mongodb';
import { MONGO_CLIENT } from '../../../../infrastructure/persistence/mongodb/mongodb.tokens';
import type { InventoryUnitOfWork } from '../../application/ports/inventory-unit-of-work.port';
import { MongoSessionContext } from '../../../../infrastructure/persistence/mongodb/mongodb-session.context';

@Injectable()
export class MongoInventoryUnitOfWork implements InventoryUnitOfWork {
  constructor(
    @Inject(MONGO_CLIENT) private readonly mongoClient: MongoClient,
    private readonly mongoSessionContext: MongoSessionContext,
  ) {}

  async run<T>(operation: () => Promise<T>): Promise<T> {
    const result = await this.mongoClient.withSession(async (session) =>
      session.withTransaction(() =>
        this.mongoSessionContext.runWithSession(session, operation),
      ),
    );

    if (result === undefined) {
      throw new Error('Mongo transaction finished without result.');
    }

    return result;
  }
}
