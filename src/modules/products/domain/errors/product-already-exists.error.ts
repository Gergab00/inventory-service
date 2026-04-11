export class ProductAlreadyExistsError extends Error {
  constructor(identifierType: string, identifierValue: string) {
    super(
      `A product already exists with ${identifierType}=${identifierValue}.`,
    );
    this.name = 'ProductAlreadyExistsError';
  }
}
