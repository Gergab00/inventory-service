import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AppConfigService } from './../src/infrastructure/config/app-config.service';
import { setupApiDocumentation } from './../src/infrastructure/config/api-documentation.setup';

process.env.API_KEY ??= 'test-api-key';
process.env.NODE_ENV ??= 'test';
process.env.DOCS_ENABLED ??= 'true';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await setupApiDocumentation(app, app.get(AppConfigService));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

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
    expect(response.body.paths['/']).toBeDefined();
    expect(response.body.paths['/health']).toBeDefined();
  });
});
