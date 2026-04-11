export type NodeEnvironment = 'development' | 'test' | 'production';
export type DatabaseType = 'in-memory' | 'mongodb';

export interface EnvironmentVariables {
  readonly NODE_ENV: NodeEnvironment;
  readonly PORT: number;
  readonly API_KEY: string;
  readonly DOCS_ENABLED: boolean;
  readonly DOCS_PATH: string;
  readonly OPENAPI_JSON_PATH: string;
  readonly DATABASE_TYPE: DatabaseType;
  readonly MONGODB_URI?: string;
  readonly MONGODB_DB_NAME?: string;
}
