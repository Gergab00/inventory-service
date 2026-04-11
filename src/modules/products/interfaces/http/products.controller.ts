import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { API_ERROR_CODES } from '../../../../interfaces/http/errors/api-error-codes';
import { ApiHttpException } from '../../../../interfaces/http/errors/api-http.exception';
import { createRequestId } from '../../../../interfaces/http/support/request-context';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { GetProductByIdUseCase } from '../../application/use-cases/get-product-by-id.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { SoftDeleteProductUseCase } from '../../application/use-cases/soft-delete-product.use-case';
import { UpdateProductImagesUseCase } from '../../application/use-cases/update-product-images.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { CreateProductRequestDto } from './dto/create-product.request.dto';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import {
  CreateProductResponseDto,
  ProductEnvelopeResponseDto,
  ProductImageReferenceListResponseDto,
  ProductListResponseDto,
  ProductResponseDto,
} from './dto/product.response.dto';
import { UpdateProductImagesRequestDto } from './dto/update-product-images.request.dto';
import { UpdateProductRequestDto } from './dto/update-product.request.dto';

@ApiTags('products')
@ApiSecurity('api_key')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly updateProductImagesUseCase: UpdateProductImagesUseCase,
    private readonly softDeleteProductUseCase: SoftDeleteProductUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crea un producto',
    description:
      'Registra un producto con identidad interna estable y sus identificadores externos normalizados.',
  })
  @ApiCreatedResponse({
    description: 'Producto creado correctamente.',
    type: CreateProductResponseDto,
  })
  async create(
    @Body() requestDto: CreateProductRequestDto,
  ): Promise<CreateProductResponseDto> {
    const product = await this.createProductUseCase.execute({
      title: requestDto.title,
      brand: requestDto.brand,
      externalIdentifiers: requestDto.externalIdentifiers,
      attributes: requestDto.attributes,
    });

    return {
      data: { id: product.toPrimitives().id },
      meta: this.createMeta(),
    };
  }

  @Get(':productId')
  @ApiOperation({
    summary: 'Obtiene un producto por id',
    description: 'Recupera el detalle público y estable del producto solicitado.',
  })
  @ApiOkResponse({
    description: 'Detalle del producto.',
    type: ProductEnvelopeResponseDto,
  })
  async getById(
    @Param('productId') productId: string,
  ): Promise<ProductEnvelopeResponseDto> {
    const product = await this.getProductByIdUseCase.execute(productId);

    if (product === null) {
      throw this.createProductNotFoundException(productId);
    }

    return {
      data: this.toProductResponse(product),
      meta: this.createMeta(),
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Lista productos',
    description: 'Devuelve productos paginados con filtros por título, marca, estado o identificadores.',
  })
  @ApiOkResponse({
    description: 'Listado paginado de productos.',
    type: ProductListResponseDto,
  })
  async list(
    @Query() queryDto: ListProductsQueryDto,
  ): Promise<ProductListResponseDto> {
    const result = await this.listProductsUseCase.execute({
      page: queryDto.page ?? 1,
      pageSize: queryDto.pageSize ?? 20,
      title: queryDto.title,
      brand: queryDto.brand,
      status: queryDto.status,
      identifierType: queryDto.identifierType,
      identifierValue: queryDto.identifierValue,
    });

    return {
      data: result.items.map((product) => this.toProductResponse(product)),
      meta: {
        ...this.createMeta(),
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    };
  }

  @Put(':productId')
  @ApiOperation({
    summary: 'Actualiza un producto',
    description: 'Actualiza campos controlados del producto sin mezclar movimientos de inventario.',
  })
  @ApiOkResponse({
    description: 'Producto actualizado.',
    type: ProductEnvelopeResponseDto,
  })
  async update(
    @Param('productId') productId: string,
    @Body() requestDto: UpdateProductRequestDto,
  ): Promise<ProductEnvelopeResponseDto> {
    const product = await this.updateProductUseCase.execute({
      productId,
      title: requestDto.title,
      brand: requestDto.brand,
      status: requestDto.status,
      externalIdentifiers: requestDto.externalIdentifiers,
      attributes: requestDto.attributes,
    });

    if (product === null) {
      throw this.createProductNotFoundException(productId);
    }

    return {
      data: this.toProductResponse(product),
      meta: this.createMeta(),
    };
  }

  @Put(':productId/images')
  @ApiOperation({
    summary: 'Sincroniza referencias de imágenes del producto',
    description:
      'Actualiza explícitamente las referencias de imagen provenientes del flujo de orquestación.',
  })
  @ApiOkResponse({
    description: 'Referencias de imágenes actualizadas.',
    type: ProductEnvelopeResponseDto,
  })
  async updateImages(
    @Param('productId') productId: string,
    @Body() requestDto: UpdateProductImagesRequestDto,
  ): Promise<ProductEnvelopeResponseDto> {
    const product = await this.updateProductImagesUseCase.execute({
      productId,
      images: requestDto.images,
    });

    if (product === null) {
      throw this.createProductNotFoundException(productId);
    }

    return {
      data: this.toProductResponse(product),
      meta: this.createMeta(),
    };
  }

  @Get(':productId/image-references')
  @ApiOperation({
    summary: 'Lista las referencias de imagen del producto',
    description: 'Devuelve las referencias actuales de imagen del producto solicitado.',
  })
  @ApiOkResponse({
    description: 'Referencias de imagen del producto.',
    type: ProductImageReferenceListResponseDto,
  })
  async getImageReferences(
    @Param('productId') productId: string,
  ): Promise<ProductImageReferenceListResponseDto> {
    const product = await this.getProductByIdUseCase.execute(productId);

    if (product === null) {
      throw this.createProductNotFoundException(productId);
    }

    return {
      data: this.toProductResponse(product).imageReferences,
      meta: this.createMeta(),
    };
  }

  @Delete(':productId')
  @ApiOperation({
    summary: 'Desactiva un producto',
    description: 'Realiza soft delete del producto cambiando su estado a inactive.',
  })
  @ApiOkResponse({
    description: 'Producto desactivado correctamente.',
    type: ProductEnvelopeResponseDto,
  })
  async softDelete(
    @Param('productId') productId: string,
  ): Promise<ProductEnvelopeResponseDto> {
    const product = await this.softDeleteProductUseCase.execute(productId);

    if (product === null) {
      throw this.createProductNotFoundException(productId);
    }

    return {
      data: this.toProductResponse(product),
      meta: this.createMeta(),
    };
  }

  private createProductNotFoundException(productId: string): ApiHttpException {
    return new ApiHttpException(404, {
      code: API_ERROR_CODES.PRODUCT_NOT_FOUND,
      message: 'El producto solicitado no existe.',
      details: [{ productId }],
    });
  }

  private createMeta(): { requestId: string } {
    return {
      requestId: createRequestId(),
    };
  }

  private toProductResponse(product: { toPrimitives(): ProductResponseDto }): ProductResponseDto {
    return product.toPrimitives();
  }
}
