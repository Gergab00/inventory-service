import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ApiExceptionFilter } from '../../interfaces/http/filters/api-exception.filter';
import { API_ERROR_CODES } from '../../interfaces/http/errors/api-error-codes';
import { ApiHttpException } from '../../interfaces/http/errors/api-http.exception';

export const API_PREFIX = 'api/v1';

export function setupHttpApplication(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[]) => {
        return new ApiHttpException(HttpStatus.BAD_REQUEST, {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: 'La solicitud contiene datos inválidos.',
          details: flattenValidationErrors(validationErrors),
        });
      },
    }),
  );
}

function flattenValidationErrors(
  validationErrors: ValidationError[],
  parentPath?: string,
): Array<{ field: string; message: string }> {
  return validationErrors.flatMap((validationError) => {
    const field = parentPath
      ? `${parentPath}.${validationError.property}`
      : validationError.property;
    const currentLevelDetails = Object.values(validationError.constraints ?? {}).map((message) => ({
      field,
      message,
    }));
    const nestedDetails = flattenValidationErrors(validationError.children ?? [], field);

    return [...currentLevelDetails, ...nestedDetails];
  });
}
