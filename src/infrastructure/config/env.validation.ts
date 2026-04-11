import { EnvironmentVariables, NodeEnvironment } from './environment-variables';

const ALLOWED_NODE_ENVIRONMENTS: readonly NodeEnvironment[] = [
  'development',
  'test',
  'production',
];

function parsePort(value: unknown): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Environment variable PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function parseApiKey(value: unknown): string {
  const apiKey = typeof value === 'string' ? value.trim() : '';

  if (apiKey.length === 0) {
    throw new Error('Environment variable API_KEY is required.');
  }

  return apiKey;
}

function parseBoolean(
  value: unknown,
  variableName: string,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(`Environment variable ${variableName} must be a boolean value.`);
  }

  const normalizedValue = value.trim().toLowerCase();

  if (['true', '1', 'yes'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no'].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`Environment variable ${variableName} must be a boolean value.`);
}

function parseRoutePath(
  value: unknown,
  variableName: string,
  defaultValue: string,
): string {
  const resolvedPath =
    typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : defaultValue;

  if (!resolvedPath.startsWith('/')) {
    throw new Error(`Environment variable ${variableName} must start with "/".`);
  }

  if (resolvedPath.length > 1 && resolvedPath.endsWith('/')) {
    return resolvedPath.slice(0, -1);
  }

  return resolvedPath;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const nodeEnv = (config.NODE_ENV ?? 'development') as string;

  if (!ALLOWED_NODE_ENVIRONMENTS.includes(nodeEnv as NodeEnvironment)) {
    throw new Error(
      `Environment variable NODE_ENV must be one of: ${ALLOWED_NODE_ENVIRONMENTS.join(', ')}.`,
    );
  }

  return {
    NODE_ENV: nodeEnv as NodeEnvironment,
    PORT: parsePort(config.PORT ?? '3000'),
    API_KEY: parseApiKey(config.API_KEY),
    DOCS_ENABLED: parseBoolean(config.DOCS_ENABLED, 'DOCS_ENABLED', true),
    DOCS_PATH: parseRoutePath(config.DOCS_PATH, 'DOCS_PATH', '/docs'),
    OPENAPI_JSON_PATH: parseRoutePath(
      config.OPENAPI_JSON_PATH,
      'OPENAPI_JSON_PATH',
      '/openapi.json',
    ),
  };
}
