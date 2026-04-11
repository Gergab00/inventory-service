import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DatabaseType,
  EnvironmentVariables,
  NodeEnvironment,
} from './environment-variables';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  get nodeEnv(): NodeEnvironment {
    return this.configService.getOrThrow<NodeEnvironment>('NODE_ENV');
  }

  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }

  get apiKey(): string {
    return this.configService.getOrThrow<string>('API_KEY');
  }

  get docsEnabled(): boolean {
    return this.configService.getOrThrow<boolean>('DOCS_ENABLED');
  }

  get docsPath(): string {
    return this.configService.getOrThrow<string>('DOCS_PATH');
  }

  get openApiJsonPath(): string {
    return this.configService.getOrThrow<string>('OPENAPI_JSON_PATH');
  }

  get databaseType(): DatabaseType {
    return this.configService.getOrThrow<DatabaseType>('DATABASE_TYPE');
  }

  get mongodbUri(): string | undefined {
    return this.configService.get<string>('MONGODB_URI');
  }

  get mongodbDbName(): string | undefined {
    return this.configService.get<string>('MONGODB_DB_NAME');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
