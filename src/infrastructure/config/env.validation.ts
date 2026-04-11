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
  };
}
