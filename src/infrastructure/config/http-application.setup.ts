import { INestApplication, ValidationPipe } from '@nestjs/common';

export const API_PREFIX = 'api/v1';

export function setupHttpApplication(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
