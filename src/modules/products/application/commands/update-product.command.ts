import { ProductExternalIdentifier, ProductStatus } from '../../domain/entities/product.entity';

export interface UpdateProductCommand {
  readonly productId: string;
  readonly title?: string;
  readonly brand?: string;
  readonly status?: ProductStatus;
  readonly externalIdentifiers?: ProductExternalIdentifier[];
  readonly attributes?: Record<string, string>;
}

export interface UpdateProductImagesCommand {
  readonly productId: string;
  readonly images: Array<{
    readonly url: string;
    readonly role: string;
  }>;
}
