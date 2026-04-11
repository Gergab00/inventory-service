import { Module } from '@nestjs/common';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { SoftDeleteProductUseCase } from './application/use-cases/soft-delete-product.use-case';
import { UpdateProductImagesUseCase } from './application/use-cases/update-product-images.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { PRODUCT_REPOSITORY } from './domain/ports/product.repository.port';
import { InMemoryProductRepository } from './infrastructure/repositories/in-memory-product.repository';
import { ProductsController } from './interfaces/http/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    CreateProductUseCase,
    GetProductByIdUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    UpdateProductImagesUseCase,
    SoftDeleteProductUseCase,
    InMemoryProductRepository,
    {
      provide: PRODUCT_REPOSITORY,
      useExisting: InMemoryProductRepository,
    },
  ],
})
export class ProductsModule {}
