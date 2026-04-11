import { HttpException } from '@nestjs/common';
import type { ApiErrorCode } from './api-error-codes';

export type ApiErrorDetail = Record<string, unknown>;

interface ApiHttpExceptionPayload {
  readonly code: ApiErrorCode | string;
  readonly message: string;
  readonly details?: ApiErrorDetail[];
}

export class ApiHttpException extends HttpException {
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(statusCode: number, payload: ApiHttpExceptionPayload) {
    const details = payload.details ?? [];

    super(
      {
        code: payload.code,
        message: payload.message,
        details,
      },
      statusCode,
    );

    this.code = payload.code;
    this.details = details;
  }
}
