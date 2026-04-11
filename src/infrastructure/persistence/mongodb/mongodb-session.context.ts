import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { ClientSession } from 'mongodb';

@Injectable()
export class MongoSessionContext {
  private readonly asyncLocalStorage = new AsyncLocalStorage<ClientSession>();

  runWithSession<T>(session: ClientSession, operation: () => Promise<T>): Promise<T> {
    return this.asyncLocalStorage.run(session, operation);
  }

  getCurrentSession(): ClientSession | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
