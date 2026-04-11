import { Injectable } from '@nestjs/common';
import type { InventoryUnitOfWork } from '../../application/ports/inventory-unit-of-work.port';

@Injectable()
export class NoopInventoryUnitOfWork implements InventoryUnitOfWork {
  async run<T>(operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}
