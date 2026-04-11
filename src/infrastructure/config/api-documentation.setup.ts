import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppConfigService } from './app-config.service';

export async function setupApiDocumentation(
  app: INestApplication,
  appConfig: AppConfigService,
): Promise<void> {
  if (!appConfig.docsEnabled) {
    return;
  }

  const { apiReference } = await import('@scalar/nestjs-api-reference');

  const openApiDocument = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Inventory Service API')
      .setDescription(
        'Documentación interactiva para explorar y probar los endpoints expuestos por inventory-service. Las respuestas exitosas usan `data + meta.requestId` y los errores HTTP exponen un envelope uniforme con `error.code`, `error.message`, `error.details[]` y `meta.requestId`.',
      )
      .setVersion('1.0.0')
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'api_key',
          description:
            'Clave obligatoria para consumir la API pública versionada. Debe coincidir con API_KEY del entorno.',
        },
        'api_key',
      )
      .addSecurityRequirements('api_key')
      .build(),
  );

  app.use(
    appConfig.openApiJsonPath,
    (_request: Request, response: Response) => {
      response.type('application/json');
      response.send(openApiDocument);
    },
  );

  app.use(
    appConfig.docsPath,
    apiReference({
      url: appConfig.openApiJsonPath,
      pageTitle: 'Inventory Service API Reference',
      theme: 'purple',
      persistAuth: true,
    }),
  );
}
