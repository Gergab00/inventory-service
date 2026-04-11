import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import type { ProductRepository } from '../../domain/ports/product.repository.port';
import { UpdateProductImagesCommand } from '../commands/update-product.command';

@Injectable()
export class UpdateProductImagesUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: UpdateProductImagesCommand): Promise<Product | null> {
    const product = await this.productRepository.findById(command.productId);

    if (product === null) {
      return null;
    }

    product.replaceImageReferences(
      command.images.map((image) => ({
        id: `imgref_${randomUUID().replace(/-/g, '')}`,
        url: image.url,
        role: image.role,
      })),
    );

    await this.productRepository.save(product);

    return product;
  }
}
