import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import type { ProductRepository } from '../../domain/ports/product.repository.port';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  execute(productId: string): Promise<Product | null> {
    return this.productRepository.findById(productId);
  }
}
