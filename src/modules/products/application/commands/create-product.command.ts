import { ProductExternalIdentifier } from '../../domain/entities/product.entity';

export interface CreateProductCommand {
  readonly title: string;
  readonly brand: string;
  readonly externalIdentifiers?: ProductExternalIdentifier[];
  readonly attributes?: Record<string, string>;
}
