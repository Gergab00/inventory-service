export type NodeEnvironment = 'development' | 'test' | 'production';

export interface EnvironmentVariables {
  readonly NODE_ENV: NodeEnvironment;
  readonly PORT: number;
  readonly API_KEY: string;
}
