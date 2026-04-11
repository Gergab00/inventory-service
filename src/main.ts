import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './infrastructure/config/app-config.service';
import { setupApiDocumentation } from './infrastructure/config/api-documentation.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);

  await setupApiDocumentation(app, appConfig);

  await app.listen(appConfig.port);
}

void bootstrap();
