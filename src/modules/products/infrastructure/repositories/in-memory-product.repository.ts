import { Injectable } from '@nestjs/common';
import { Product, ProductPrimitives } from '../../domain/entities/product.entity';
import {
  ListProductsFilters,
  PaginatedProductsResult,
  ProductRepository,
} from '../../domain/ports/product.repository.port';

@Injectable()
export class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, ProductPrimitives>();

  async save(product: Product): Promise<void> {
    const primitives = product.toPrimitives();
    this.products.set(primitives.id, primitives);
  }

  async findById(productId: string): Promise<Product | null> {
    const primitives = this.products.get(productId);

    return primitives ? Product.reconstitute(primitives) : null;
  }

  async findByExternalIdentifier(
    type: string,
    value: string,
  ): Promise<Product | null> {
    const normalizedType = normalize(type);
    const normalizedValue = normalize(value);

    for (const primitives of this.products.values()) {
      const hasMatch = primitives.externalIdentifiers.some(
        (identifier) =>
          normalize(identifier.type) === normalizedType &&
          normalize(identifier.value) === normalizedValue,
      );

      if (hasMatch) {
        return Product.reconstitute(primitives);
      }
    }

    return null;
  }

  async findAll(filters: ListProductsFilters): Promise<PaginatedProductsResult> {
    const page = Math.max(filters.page, 1);
    const pageSize = Math.max(filters.pageSize, 1);

    const filteredProducts = Array.from(this.products.values())
      .map((primitives) => Product.reconstitute(primitives))
      .filter((product) => matchesFilters(product.toPrimitives(), filters))
      .sort((left, right) => {
        const leftCreatedAt = left.toPrimitives().createdAt;
        const rightCreatedAt = right.toPrimitives().createdAt;

        return leftCreatedAt.localeCompare(rightCreatedAt);
      });

    const total = filteredProducts.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = filteredProducts.slice(startIndex, startIndex + pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}

function matchesFilters(
  product: ProductPrimitives,
  filters: ListProductsFilters,
): boolean {
  if (filters.title && !normalize(product.title).includes(normalize(filters.title))) {
    return false;
  }

  if (filters.brand && !normalize(product.brand).includes(normalize(filters.brand))) {
    return false;
  }

  if (filters.status && product.status !== filters.status) {
    return false;
  }

  if (filters.identifierType || filters.identifierValue) {
    const hasMatchingIdentifier = product.externalIdentifiers.some((identifier) => {
      const typeMatches =
        !filters.identifierType ||
        normalize(identifier.type) === normalize(filters.identifierType);
      const valueMatches =
        !filters.identifierValue ||
        normalize(identifier.value) === normalize(filters.identifierValue);

      return typeMatches && valueMatches;
    });

    if (!hasMatchingIdentifier) {
      return false;
    }
  }

  return true;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
