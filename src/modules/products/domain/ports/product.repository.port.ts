import { Product, ProductStatus } from '../entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ListProductsFilters {
  readonly page: number;
  readonly pageSize: number;
  readonly title?: string;
  readonly brand?: string;
  readonly status?: ProductStatus;
  readonly identifierType?: string;
  readonly identifierValue?: string;
}

export interface PaginatedProductsResult {
  readonly items: Product[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(productId: string): Promise<Product | null>;
  findByExternalIdentifier(
    type: string,
    value: string,
  ): Promise<Product | null>;
  findAll(filters: ListProductsFilters): Promise<PaginatedProductsResult>;
}
