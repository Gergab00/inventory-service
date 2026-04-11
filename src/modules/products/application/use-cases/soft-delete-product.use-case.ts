import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import type { ProductRepository } from '../../domain/ports/product.repository.port';

@Injectable()
export class SoftDeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(productId: string): Promise<Product | null> {
    const product = await this.productRepository.findById(productId);

    if (product === null) {
      return null;
    }

    product.deactivate();
    await this.productRepository.save(product);

    return product;
  }
}
