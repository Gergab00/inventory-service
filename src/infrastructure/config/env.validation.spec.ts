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
    });
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
});
