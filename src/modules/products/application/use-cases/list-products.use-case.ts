import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import type {
  ListProductsFilters,
  PaginatedProductsResult,
  ProductRepository,
} from '../../domain/ports/product.repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  execute(query: ListProductsFilters): Promise<PaginatedProductsResult> {
    return this.productRepository.findAll(query);
  }
}
