import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../../infrastructure/config/app-config.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly appConfigService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedApiKey = this.extractApiKey(request);

    if (providedApiKey === this.appConfigService.apiKey) {
      return true;
    }

    throw new UnauthorizedException('Missing or invalid api_key.');
  }

  private extractApiKey(request: Request): string | null {
    const apiKeyHeader = request.header('api_key')?.trim();
    const legacyApiKeyHeader = request.header('x-api-key')?.trim();

    return apiKeyHeader || legacyApiKeyHeader || null;
  }
}
