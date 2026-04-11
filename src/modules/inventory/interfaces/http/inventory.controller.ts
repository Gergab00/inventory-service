import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { RegisterInventoryAdjustmentUseCase } from '../../application/use-cases/register-inventory-adjustment.use-case';
import { GetInventoryLotByIdUseCase } from '../../application/use-cases/get-inventory-lot-by-id.use-case';
import { GetProductInventoryAvailabilityUseCase } from '../../application/use-cases/get-product-inventory-availability.use-case';
import { GetProductInventoryLotsUseCase } from '../../application/use-cases/get-product-inventory-lots.use-case';
import { ListInventoryMovementsUseCase } from '../../application/use-cases/list-inventory-movements.use-case';
import { RegisterInventoryEntryUseCase } from '../../application/use-cases/register-inventory-entry.use-case';
import { RegisterInventoryExitUseCase } from '../../application/use-cases/register-inventory-exit.use-case';
import {
  InsufficientStockError,
  InventoryReferenceNotFoundError,
  UnitCostRequiredError,
} from '../../domain/errors/inventory.errors';
import {
  InventoryLotEnvelopeResponseDto,
  InventoryLotListResponseDto,
  InventoryMovementEnvelopeResponseDto,
  InventoryMovementListResponseDto,
  InventoryMovementResponseDto,
  ProductInventoryAvailabilityResponseDto,
} from './dto/inventory.response.dto';
import { ListInventoryMovementsQueryDto } from './dto/list-inventory-movements.query.dto';
import { RegisterInventoryEntryRequestDto } from './dto/register-inventory-entry.request.dto';
import {
  RegisterInventoryAdjustmentRequestDto,
  RegisterInventoryExitRequestDto,
} from './dto/register-inventory-exit.request.dto';

@ApiTags('inventory')
@ApiSecurity('api_key')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly registerInventoryEntryUseCase: RegisterInventoryEntryUseCase,
    private readonly registerInventoryExitUseCase: RegisterInventoryExitUseCase,
    private readonly registerInventoryAdjustmentUseCase: RegisterInventoryAdjustmentUseCase,
    private readonly getInventoryLotByIdUseCase: GetInventoryLotByIdUseCase,
    private readonly getProductInventoryLotsUseCase: GetProductInventoryLotsUseCase,
    private readonly getProductInventoryAvailabilityUseCase: GetProductInventoryAvailabilityUseCase,
    private readonly listInventoryMovementsUseCase: ListInventoryMovementsUseCase,
  ) {}

  @Post('entries')
  @ApiOperation({
    summary: 'Registra una entrada de inventario',
    description: 'Crea una nueva capa FIFO y registra el movimiento de entrada correspondiente.',
  })
  @ApiCreatedResponse({
    description: 'Entrada de inventario registrada correctamente.',
    type: InventoryMovementEnvelopeResponseDto,
  })
  async registerEntry(
    @Body() requestDto: RegisterInventoryEntryRequestDto,
  ): Promise<InventoryMovementEnvelopeResponseDto> {
    try {
      const movement = await this.registerInventoryEntryUseCase.execute(requestDto);

      return {
        data: movement.toPrimitives(),
        meta: this.createMeta(),
      };
    } catch (error) {
      this.rethrowInventoryError(error);
      throw error;
    }
  }

  @Post('exits')
  @ApiOperation({
    summary: 'Registra una salida de inventario',
    description: 'Consume stock en orden FIFO y registra el movimiento auditable de salida.',
  })
  @ApiCreatedResponse({
    description: 'Salida de inventario registrada correctamente.',
    type: InventoryMovementEnvelopeResponseDto,
  })
  async registerExit(
    @Body() requestDto: RegisterInventoryExitRequestDto,
  ): Promise<InventoryMovementEnvelopeResponseDto> {
    try {
      const movement = await this.registerInventoryExitUseCase.execute(requestDto);

      return {
        data: movement.toPrimitives(),
        meta: this.createMeta(),
      };
    } catch (error) {
      this.rethrowInventoryError(error);
      throw error;
    }
  }

  @Post('adjustments')
  @ApiOperation({
    summary: 'Registra un ajuste de inventario',
    description: 'Permite corregir diferencias de inventario de forma explícita y auditable.',
  })
  @ApiCreatedResponse({
    description: 'Ajuste de inventario registrado correctamente.',
    type: InventoryMovementEnvelopeResponseDto,
  })
  async registerAdjustment(
    @Body() requestDto: RegisterInventoryAdjustmentRequestDto,
  ): Promise<InventoryMovementEnvelopeResponseDto> {
    try {
      const movement = await this.registerInventoryAdjustmentUseCase.execute({
        ...requestDto,
        sourceReference: requestDto.sourceReference,
      });

      return {
        data: movement.toPrimitives(),
        meta: this.createMeta(),
      };
    } catch (error) {
      this.rethrowInventoryError(error);
      throw error;
    }
  }

  @Get('lots/:lotId')
  @ApiOperation({
    summary: 'Obtiene un lote por id',
    description: 'Recupera una capa FIFO específica para trazabilidad y auditoría.',
  })
  @ApiOkResponse({
    description: 'Detalle del lote de inventario.',
    type: InventoryLotEnvelopeResponseDto,
  })
  async getLotById(
    @Param('lotId') lotId: string,
  ): Promise<InventoryLotEnvelopeResponseDto> {
    const lot = await this.getInventoryLotByIdUseCase.execute(lotId);

    if (lot === null) {
      throw new NotFoundException('El lote solicitado no existe.');
    }

    return {
      data: lot.toPrimitives(),
      meta: this.createMeta(),
    };
  }

  @Get('products/:productId/availability')
  @ApiOperation({
    summary: 'Consulta disponibilidad por producto',
    description: 'Devuelve la disponibilidad agregada del producto por almacén.',
  })
  @ApiOkResponse({
    description: 'Disponibilidad actual del producto.',
    type: ProductInventoryAvailabilityResponseDto,
  })
  async getAvailability(
    @Param('productId') productId: string,
  ): Promise<ProductInventoryAvailabilityResponseDto> {
    try {
      const availability =
        await this.getProductInventoryAvailabilityUseCase.execute(productId);

      return {
        data: availability,
        meta: this.createMeta(),
      };
    } catch (error) {
      this.rethrowInventoryError(error);
      throw error;
    }
  }

  @Get('products/:productId')
  @ApiOperation({
    summary: 'Lista lotes de un producto',
    description: 'Devuelve las capas FIFO del producto ordenadas de la más antigua a la más nueva.',
  })
  @ApiOkResponse({
    description: 'Listado de lotes FIFO del producto.',
    type: InventoryLotListResponseDto,
  })
  async getProductLots(
    @Param('productId') productId: string,
  ): Promise<InventoryLotListResponseDto> {
    try {
      const lots = await this.getProductInventoryLotsUseCase.execute(productId);

      return {
        data: lots.map((lot) => lot.toPrimitives()),
        meta: this.createMeta(),
      };
    } catch (error) {
      this.rethrowInventoryError(error);
      throw error;
    }
  }

  @Get('movements')
  @ApiOperation({
    summary: 'Lista movimientos de inventario',
    description: 'Devuelve movimientos paginados filtrables por producto, almacén y tipo.',
  })
  @ApiOkResponse({
    description: 'Listado paginado de movimientos de inventario.',
    type: InventoryMovementListResponseDto,
  })
  async listMovements(
    @Query() queryDto: ListInventoryMovementsQueryDto,
  ): Promise<InventoryMovementListResponseDto> {
    const result = await this.listInventoryMovementsUseCase.execute({
      page: queryDto.page ?? 1,
      pageSize: queryDto.pageSize ?? 20,
      productId: queryDto.productId,
      warehouseId: queryDto.warehouseId,
      type: queryDto.type,
    });

    return {
      data: result.items.map((movement) => movement.toPrimitives() as InventoryMovementResponseDto),
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

  private createMeta(): { requestId: string } {
    return {
      requestId: `req_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    };
  }

  private rethrowInventoryError(error: unknown): never | void {
    if (error instanceof InventoryReferenceNotFoundError) {
      throw new NotFoundException(
        error.resource === 'product'
          ? 'El producto solicitado no existe.'
          : 'El almacén solicitado no existe.',
      );
    }

    if (error instanceof InsufficientStockError || error instanceof UnitCostRequiredError) {
      throw new UnprocessableEntityException(error.message);
    }
  }
}
