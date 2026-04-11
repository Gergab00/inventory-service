import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
import { randomUUID } from 'node:crypto';
import { CreateWarehouseUseCase } from '../../application/use-cases/create-warehouse.use-case';
import { GetWarehouseByIdUseCase } from '../../application/use-cases/get-warehouse-by-id.use-case';
import { ListWarehousesUseCase } from '../../application/use-cases/list-warehouses.use-case';
import { SoftDeleteWarehouseUseCase } from '../../application/use-cases/soft-delete-warehouse.use-case';
import { UpdateWarehouseUseCase } from '../../application/use-cases/update-warehouse.use-case';
import { WarehouseAlreadyExistsError } from '../../domain/errors/warehouse-already-exists.error';
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
    try {
      const warehouse = await this.createWarehouseUseCase.execute({
        code: requestDto.code,
        name: requestDto.name,
        processingTimeDays: requestDto.processingTimeDays,
      });

      return {
        data: { id: warehouse.toPrimitives().id },
        meta: this.createMeta(),
      };
    } catch (error) {
      if (error instanceof WarehouseAlreadyExistsError) {
        throw new ConflictException('Ya existe un almacén con ese código.');
      }

      throw error;
    }
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
      throw new NotFoundException('El almacén solicitado no existe.');
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
      throw new NotFoundException('El almacén solicitado no existe.');
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
      throw new NotFoundException('El almacén solicitado no existe.');
    }

    return {
      data: this.toWarehouseResponse(warehouse),
      meta: this.createMeta(),
    };
  }

  private createMeta(): { requestId: string } {
    return {
      requestId: `req_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    };
  }

  private toWarehouseResponse(warehouse: { toPrimitives(): WarehouseResponseDto }): WarehouseResponseDto {
    return warehouse.toPrimitives();
  }
}
