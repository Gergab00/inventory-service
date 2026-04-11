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
import { CreateWarehouseUseCase } from '../../application/use-cases/create-warehouse.use-case';
import { GetWarehouseByIdUseCase } from '../../application/use-cases/get-warehouse-by-id.use-case';
import { ListWarehousesUseCase } from '../../application/use-cases/list-warehouses.use-case';
import { SoftDeleteWarehouseUseCase } from '../../application/use-cases/soft-delete-warehouse.use-case';
import { UpdateWarehouseUseCase } from '../../application/use-cases/update-warehouse.use-case';
import { CreateWarehouseRequestDto } from './dto/create-warehouse.request.dto';
import { ListWarehousesQueryDto } from './dto/list-warehouses.query.dto';
import {
  CreateWarehouseResponseDto,
  WarehouseEnvelopeResponseDto,
  WarehouseListResponseDto,
  WarehouseResponseDto,
} from './dto/warehouse.response.dto';
import { UpdateWarehouseRequestDto } from './dto/update-warehouse.request.dto';

@ApiTags('warehouses')
@ApiSecurity('api_key')
@Controller('warehouses')
export class WarehousesController {
  constructor(
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    private readonly getWarehouseByIdUseCase: GetWarehouseByIdUseCase,
    private readonly listWarehousesUseCase: ListWarehousesUseCase,
    private readonly updateWarehouseUseCase: UpdateWarehouseUseCase,
    private readonly softDeleteWarehouseUseCase: SoftDeleteWarehouseUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crea un almacén',
    description: 'Registra un almacén con código estable y tiempo de procesamiento propio.',
  })
  @ApiCreatedResponse({
    description: 'Almacén creado correctamente.',
    type: CreateWarehouseResponseDto,
  })
  async create(
    @Body() requestDto: CreateWarehouseRequestDto,
  ): Promise<CreateWarehouseResponseDto> {
    const warehouse = await this.createWarehouseUseCase.execute({
      code: requestDto.code,
      name: requestDto.name,
      processingTimeDays: requestDto.processingTimeDays,
    });

    return {
      data: { id: warehouse.toPrimitives().id },
      meta: this.createMeta(),
    };
  }

  @Get(':warehouseId')
  @ApiOperation({
    summary: 'Obtiene un almacén por id',
    description: 'Recupera el detalle público del almacén solicitado.',
  })
  @ApiOkResponse({
    description: 'Detalle del almacén.',
    type: WarehouseEnvelopeResponseDto,
  })
  async getById(
    @Param('warehouseId') warehouseId: string,
  ): Promise<WarehouseEnvelopeResponseDto> {
    const warehouse = await this.getWarehouseByIdUseCase.execute(warehouseId);

    if (warehouse === null) {
      throw this.createWarehouseNotFoundException(warehouseId);
    }

    return {
      data: this.toWarehouseResponse(warehouse),
      meta: this.createMeta(),
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Lista almacenes',
    description: 'Devuelve almacenes paginados con filtros por código, nombre o estado.',
  })
  @ApiOkResponse({
    description: 'Listado paginado de almacenes.',
    type: WarehouseListResponseDto,
  })
  async list(
    @Query() queryDto: ListWarehousesQueryDto,
  ): Promise<WarehouseListResponseDto> {
    const result = await this.listWarehousesUseCase.execute({
      page: queryDto.page ?? 1,
      pageSize: queryDto.pageSize ?? 20,
      code: queryDto.code,
      name: queryDto.name,
      status: queryDto.status,
    });

    return {
      data: result.items.map((warehouse) => this.toWarehouseResponse(warehouse)),
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

  @Put(':warehouseId')
  @ApiOperation({
    summary: 'Actualiza un almacén',
    description: 'Actualiza código, nombre o tiempo de procesamiento del almacén.',
  })
  @ApiOkResponse({
    description: 'Almacén actualizado correctamente.',
    type: WarehouseEnvelopeResponseDto,
  })
  async update(
    @Param('warehouseId') warehouseId: string,
    @Body() requestDto: UpdateWarehouseRequestDto,
  ): Promise<WarehouseEnvelopeResponseDto> {
    const warehouse = await this.updateWarehouseUseCase.execute({
      warehouseId,
      code: requestDto.code,
      name: requestDto.name,
      processingTimeDays: requestDto.processingTimeDays,
      status: requestDto.status,
    });

    if (warehouse === null) {
      throw this.createWarehouseNotFoundException(warehouseId);
    }

    return {
      data: this.toWarehouseResponse(warehouse),
      meta: this.createMeta(),
    };
  }

  @Delete(':warehouseId')
  @ApiOperation({
    summary: 'Desactiva un almacén',
    description: 'Realiza soft delete del almacén cambiando su estado a inactive.',
  })
  @ApiOkResponse({
    description: 'Almacén desactivado correctamente.',
    type: WarehouseEnvelopeResponseDto,
  })
  async softDelete(
    @Param('warehouseId') warehouseId: string,
  ): Promise<WarehouseEnvelopeResponseDto> {
    const warehouse = await this.softDeleteWarehouseUseCase.execute(warehouseId);

    if (warehouse === null) {
      throw this.createWarehouseNotFoundException(warehouseId);
    }

    return {
      data: this.toWarehouseResponse(warehouse),
      meta: this.createMeta(),
    };
  }

  private createWarehouseNotFoundException(warehouseId: string): ApiHttpException {
    return new ApiHttpException(404, {
      code: API_ERROR_CODES.WAREHOUSE_NOT_FOUND,
      message: 'El almacén solicitado no existe.',
      details: [{ warehouseId }],
    });
  }

  private createMeta(): { requestId: string } {
    return {
      requestId: createRequestId(),
    };
  }

  private toWarehouseResponse(warehouse: { toPrimitives(): WarehouseResponseDto }): WarehouseResponseDto {
    return warehouse.toPrimitives();
  }
}
