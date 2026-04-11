import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  InsufficientStockError,
  InventoryReferenceNotFoundError,
  UnitCostRequiredError,
} from '../../../modules/inventory/domain/errors/inventory.errors';
import { ProductAlreadyExistsError } from '../../../modules/products/domain/errors/product-already-exists.error';
import { WarehouseAlreadyExistsError } from '../../../modules/warehouses/domain/errors/warehouse-already-exists.error';
import type { ApiErrorResponseDto } from '../dto/api-error-response.dto';
import { API_ERROR_CODES } from '../errors/api-error-codes';
import type { ApiErrorDetail } from '../errors/api-http.exception';
import { ApiHttpException } from '../errors/api-http.exception';
import { createTimestamp, ensureRequestId } from '../support/request-context';

interface ExceptionDescriptor {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string;
  readonly details: ApiErrorDetail[];
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { statusCode, code, message, details } = this.describeException(exception);
    const requestId = ensureRequestId(request);
    const timestamp = createTimestamp();

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack ?? exception.message : String(exception);
      this.logger.error(`[${requestId}] ${request.method} ${request.url}`, stack);
    }

    const body: ApiErrorResponseDto = {
      error: {
        code,
        message,
        details,
      },
      meta: {
        requestId,
        timestamp,
      },
    };

    response.status(statusCode).json(body);
  }

  private describeException(exception: unknown): ExceptionDescriptor {
    if (exception instanceof ApiHttpException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: this.extractMessageFromHttpException(exception),
        details: exception.details,
      };
    }

    if (exception instanceof ProductAlreadyExistsError) {
      return {
        statusCode: HttpStatus.CONFLICT,
        code: API_ERROR_CODES.PRODUCT_ALREADY_EXISTS,
        message: 'Ya existe un producto con ese identificador externo.',
        details: [],
      };
    }

    if (exception instanceof WarehouseAlreadyExistsError) {
      return {
        statusCode: HttpStatus.CONFLICT,
        code: API_ERROR_CODES.WAREHOUSE_ALREADY_EXISTS,
        message: 'Ya existe un almacén con ese código.',
        details: [],
      };
    }

    if (exception instanceof InventoryReferenceNotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        code: exception.resource === 'product'
          ? API_ERROR_CODES.PRODUCT_NOT_FOUND
          : API_ERROR_CODES.WAREHOUSE_NOT_FOUND,
        message: exception.resource === 'product'
          ? 'El producto solicitado no existe.'
          : 'El almacén solicitado no existe.',
        details: [{
          resource: exception.resource,
          id: exception.id,
        }],
      };
    }

    if (exception instanceof InsufficientStockError) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        code: API_ERROR_CODES.INSUFFICIENT_STOCK,
        message: 'No hay stock suficiente para completar la salida solicitada.',
        details: [{
          productId: exception.productId,
          warehouseId: exception.warehouseId,
          requestedQuantity: exception.requestedQuantity,
          availableQuantity: exception.availableQuantity,
        }],
      };
    }

    if (exception instanceof UnitCostRequiredError) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        code: API_ERROR_CODES.UNIT_COST_REQUIRED,
        message: 'unitCost es obligatorio para entradas y ajustes positivos de inventario.',
        details: [],
      };
    }

    if (exception instanceof HttpException) {
      return this.describeHttpException(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: API_ERROR_CODES.INTERNAL_ERROR,
      message: 'Ocurrió un error interno inesperado.',
      details: [],
    };
  }

  private describeHttpException(exception: HttpException): ExceptionDescriptor {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        code: this.defaultCodeForStatus(statusCode),
        message: exceptionResponse,
        details: [],
      };
    }

    const responseBody =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : {};

    const rawMessage = responseBody.message;

    if (Array.isArray(rawMessage)) {
      return {
        statusCode,
        code:
          typeof responseBody.code === 'string'
            ? responseBody.code
            : API_ERROR_CODES.VALIDATION_FAILED,
        message: 'La solicitud contiene datos inválidos.',
        details: rawMessage.map((message) => ({ message: String(message) })),
      };
    }

    return {
      statusCode,
      code:
        typeof responseBody.code === 'string'
          ? responseBody.code
          : this.defaultCodeForStatus(statusCode),
      message:
        typeof rawMessage === 'string'
          ? rawMessage
          : this.defaultMessageForStatus(statusCode),
      details: this.normalizeDetails(responseBody.details),
    };
  }

  private extractMessageFromHttpException(exception: HttpException): string {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const rawMessage = (exceptionResponse as Record<string, unknown>).message;

      if (typeof rawMessage === 'string') {
        return rawMessage;
      }
    }

    return this.defaultMessageForStatus(exception.getStatus());
  }

  private normalizeDetails(details: unknown): ApiErrorDetail[] {
    if (!Array.isArray(details)) {
      return [];
    }

    return details.map((detail) => {
      if (typeof detail === 'object' && detail !== null) {
        return detail as ApiErrorDetail;
      }

      return { message: String(detail) };
    });
  }

  private defaultCodeForStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return API_ERROR_CODES.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return API_ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.NOT_FOUND:
        return API_ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return API_ERROR_CODES.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return API_ERROR_CODES.UNPROCESSABLE_ENTITY;
      default:
        return API_ERROR_CODES.INTERNAL_ERROR;
    }
  }

  private defaultMessageForStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'La solicitud no pudo procesarse.';
      case HttpStatus.UNAUTHORIZED:
        return 'No autorizado.';
      case HttpStatus.NOT_FOUND:
        return 'El recurso solicitado no existe.';
      case HttpStatus.CONFLICT:
        return 'La operación entra en conflicto con el estado actual del recurso.';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'La operación viola una regla de negocio.';
      default:
        return 'Ocurrió un error interno inesperado.';
    }
  }
}
