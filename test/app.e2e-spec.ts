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

  it('creates and retrieves a product', async () => {
    const createResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/products`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        title: 'Nintendo Switch OLED',
        brand: 'Nintendo',
        externalIdentifiers: [{ type: 'asin', value: 'B07TWW67JS' }],
        attributes: { color: 'White' },
      })
      .expect(201);

    expect(createResponse.body.meta.requestId).toEqual(expect.any(String));
    expect(createResponse.body.data.id).toMatch(/^prd_/);

    const productId = createResponse.body.data.id as string;

    const getResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/products/${productId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(getResponse.body.data).toMatchObject({
      id: productId,
      title: 'Nintendo Switch OLED',
      brand: 'Nintendo',
      status: 'active',
      externalIdentifiers: [{ type: 'asin', value: 'B07TWW67JS' }],
      attributes: { color: 'White' },
      imageReferences: [],
    });
  });

  it('lists, updates images, and soft deletes a product', async () => {
    const createResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/products`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        title: 'PlayStation 5',
        brand: 'Sony',
        externalIdentifiers: [{ type: 'asin', value: 'B0PS5' }],
      })
      .expect(201);

    const productId = createResponse.body.data.id as string;

    const listResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/products?page=1&pageSize=20&title=playstation`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.meta.pagination).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });

    const updateResponse = await request(app.getHttpServer())
      .put(`${API_PREFIX}/products/${productId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        title: 'PlayStation 5 Slim',
        attributes: { color: 'White' },
      })
      .expect(200);

    expect(updateResponse.body.data).toMatchObject({
      id: productId,
      title: 'PlayStation 5 Slim',
      brand: 'Sony',
      status: 'active',
      attributes: { color: 'White' },
    });

    const imageResponse = await request(app.getHttpServer())
      .put(`${API_PREFIX}/products/${productId}/images`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        images: [
          { url: 'https://cdn.example.com/ps5-primary.jpg', role: 'primary' },
          { url: 'https://cdn.example.com/ps5-secondary.jpg', role: 'secondary' },
        ],
      })
      .expect(200);

    expect(imageResponse.body.data.imageReferences).toHaveLength(2);

    const imageListResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/products/${productId}/image-references`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(imageListResponse.body.data).toHaveLength(2);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`${API_PREFIX}/products/${productId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(deleteResponse.body.data).toMatchObject({
      id: productId,
      status: 'inactive',
    });
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
