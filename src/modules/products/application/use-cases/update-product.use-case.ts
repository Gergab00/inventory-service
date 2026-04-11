import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import type { ProductRepository } from '../../domain/ports/product.repository.port';
import { UpdateProductCommand } from '../commands/update-product.command';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product | null> {
    const product = await this.productRepository.findById(command.productId);

    if (product === null) {
      return null;
    }

    product.update({
      title: command.title,
      brand: command.brand,
      status: command.status,
      externalIdentifiers: command.externalIdentifiers,
      attributes: command.attributes,
    });

    await this.productRepository.save(product);

    return product;
  }
}
