import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('should normalize valid environment variables', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'development',
      PORT: '3000',
      API_KEY: 'local-api-key',
    });

    expect(environment).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      API_KEY: 'local-api-key',
      DOCS_ENABLED: true,
      DOCS_PATH: '/docs',
      OPENAPI_JSON_PATH: '/openapi.json',
      DATABASE_TYPE: 'in-memory',
      MONGODB_URI: undefined,
      MONGODB_DB_NAME: undefined,
    });
  });

  it('should normalize persistence configuration when DATABASE_TYPE is provided', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'test',
      PORT: '3000',
      API_KEY: 'local-api-key',
      DATABASE_TYPE: 'mongodb',
      MONGODB_URI: 'mongodb://localhost:27017',
      MONGODB_DB_NAME: 'inventory-service',
    });

    expect(environment.DATABASE_TYPE).toBe('mongodb');
    expect(environment.MONGODB_URI).toBe('mongodb://localhost:27017');
    expect(environment.MONGODB_DB_NAME).toBe('inventory-service');
  });

  it('should throw when PORT is invalid', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '0',
        API_KEY: 'local-api-key',
      }),
    ).toThrow('Environment variable PORT must be an integer between 1 and 65535.');
  });

  it('should throw when API_KEY is missing', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
      }),
    ).toThrow('Environment variable API_KEY is required.');
  });

  it('should throw when DOCS_PATH does not start with a slash', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        API_KEY: 'local-api-key',
        DOCS_PATH: 'docs',
      }),
    ).toThrow('Environment variable DOCS_PATH must start with "/".');
  });

  it('should throw when DATABASE_TYPE is not supported', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '3000',
        API_KEY: 'local-api-key',
        DATABASE_TYPE: 'postgres',
      }),
    ).toThrow('Environment variable DATABASE_TYPE must be one of: in-memory, mongodb.');
  });
});
