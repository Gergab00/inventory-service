import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../../infrastructure/config/app-config.service';
import { API_ERROR_CODES } from '../errors/api-error-codes';
import { ApiHttpException } from '../errors/api-http.exception';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly appConfigService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedApiKey = this.extractApiKey(request);

    if (providedApiKey === null) {
      throw new ApiHttpException(401, {
        code: API_ERROR_CODES.MISSING_API_KEY,
        message: 'El header api_key es obligatorio para consumir la API pública.',
        details: [],
      });
    }

    if (providedApiKey === this.appConfigService.apiKey) {
      return true;
    }

    throw new ApiHttpException(401, {
      code: API_ERROR_CODES.INVALID_API_KEY,
      message: 'El valor enviado en api_key no coincide con la configuración esperada.',
      details: [],
    });
  }

  private extractApiKey(request: Request): string | null {
    const apiKeyHeader = request.header('api_key')?.trim();
    const legacyApiKeyHeader = request.header('x-api-key')?.trim();

    return apiKeyHeader || legacyApiKeyHeader || null;
  }
}
