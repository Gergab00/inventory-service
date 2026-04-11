import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AppConfigService } from './../src/infrastructure/config/app-config.service';
import { setupApiDocumentation } from './../src/infrastructure/config/api-documentation.setup';
import { setupHttpApplication } from './../src/infrastructure/config/http-application.setup';

process.env.API_KEY ??= 'test-api-key';
process.env.NODE_ENV ??= 'test';
process.env.DOCS_ENABLED ??= 'true';

const API_PREFIX = '/api/v1';
const API_KEY_HEADER = 'api_key';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const appConfig = app.get(AppConfigService);

    setupHttpApplication(app);
    await setupApiDocumentation(app, appConfig);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects requests without api_key', () => {
    return request(app.getHttpServer()).get(`${API_PREFIX}/health`).expect(401);
  });

  it('rejects requests with an invalid api_key', () => {
    return request(app.getHttpServer())
      .get(`${API_PREFIX}/health`)
      .set(API_KEY_HEADER, 'invalid-key')
      .expect(401);
  });

  it(`${API_PREFIX} (GET)`, () => {
    return request(app.getHttpServer())
      .get(API_PREFIX)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200)
      .expect('Hello World!');
  });

  it(`${API_PREFIX}/health (GET)`, async () => {
    const response = await request(app.getHttpServer())
      .get(`${API_PREFIX}/health`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'inventory-service',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('/docs (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/docs').expect(200);

    expect(response.headers['content-type']).toMatch(/html/);
    expect(response.text).toContain('Inventory Service API');
  });

  it('/openapi.json (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/openapi.json')
      .expect(200);

    expect(response.body.info.title).toBe('Inventory Service API');
    expect(response.body.paths[API_PREFIX]).toBeDefined();
    expect(response.body.paths[`${API_PREFIX}/health`]).toBeDefined();
    expect(response.body.components.securitySchemes.api_key).toBeDefined();
  });
});
