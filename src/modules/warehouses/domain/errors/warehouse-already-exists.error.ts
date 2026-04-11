export class WarehouseAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`A warehouse already exists with code=${code}.`);
    this.name = 'WarehouseAlreadyExistsError';
  }
}
