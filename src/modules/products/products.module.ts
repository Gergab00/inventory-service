import { Module } from '@nestjs/common';
import { productPersistenceProviders } from '../../infrastructure/persistence/repository.providers';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { SoftDeleteProductUseCase } from './application/use-cases/soft-delete-product.use-case';
import { UpdateProductImagesUseCase } from './application/use-cases/update-product-images.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
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
    ...productPersistenceProviders,
  ],
  exports: [GetProductByIdUseCase],
})
export class ProductsModule {}
