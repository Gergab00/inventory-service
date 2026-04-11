export const INVENTORY_UNIT_OF_WORK = Symbol('INVENTORY_UNIT_OF_WORK');

export interface InventoryUnitOfWork {
  run<T>(operation: () => Promise<T>): Promise<T>;
}
