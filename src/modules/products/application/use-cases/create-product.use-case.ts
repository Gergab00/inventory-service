import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/entities/product.entity';
import { ProductAlreadyExistsError } from '../../domain/errors/product-already-exists.error';
import { PRODUCT_REPOSITORY } from '../../domain/ports/product.repository.port';
import type { ProductRepository } from '../../domain/ports/product.repository.port';
import { CreateProductCommand } from '../commands/create-product.command';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    for (const identifier of command.externalIdentifiers ?? []) {
      const existingProduct = await this.productRepository.findByExternalIdentifier(
        identifier.type,
        identifier.value,
      );

      if (existingProduct !== null) {
        throw new ProductAlreadyExistsError(identifier.type, identifier.value);
      }
    }

    const product = Product.create({
      id: createProductId(),
      title: command.title,
      brand: command.brand,
      externalIdentifiers: command.externalIdentifiers,
      attributes: command.attributes,
    });

    await this.productRepository.save(product);

    return product;
  }
}

function createProductId(): string {
  return `prd_${randomUUID().replace(/-/g, '')}`;
}
