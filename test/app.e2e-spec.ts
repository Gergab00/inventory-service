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

  it('creates and retrieves a warehouse', async () => {
    const createResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/warehouses`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        code: 'CDMX-01',
        name: 'Almacén CDMX',
        processingTimeDays: 1,
      })
      .expect(201);

    expect(createResponse.body.data.id).toMatch(/^wh_/);
    expect(createResponse.body.meta.requestId).toEqual(expect.any(String));

    const warehouseId = createResponse.body.data.id as string;

    const getResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/warehouses/${warehouseId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(getResponse.body.data).toMatchObject({
      id: warehouseId,
      code: 'CDMX-01',
      name: 'Almacén CDMX',
      status: 'active',
      processingTimeDays: 1,
    });
  });

  it('lists, updates, and soft deletes a warehouse', async () => {
    const createResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/warehouses`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        code: 'MTY-01',
        name: 'Almacén Monterrey',
        processingTimeDays: 2,
      })
      .expect(201);

    const warehouseId = createResponse.body.data.id as string;

    const listResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/warehouses?page=1&pageSize=20&name=monterrey`)
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
      .put(`${API_PREFIX}/warehouses/${warehouseId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        name: 'Almacén Monterrey Norte',
        processingTimeDays: 3,
      })
      .expect(200);

    expect(updateResponse.body.data).toMatchObject({
      id: warehouseId,
      code: 'MTY-01',
      name: 'Almacén Monterrey Norte',
      processingTimeDays: 3,
      status: 'active',
    });

    const deleteResponse = await request(app.getHttpServer())
      .delete(`${API_PREFIX}/warehouses/${warehouseId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(deleteResponse.body.data).toMatchObject({
      id: warehouseId,
      status: 'inactive',
    });
  });

  it('registers inventory entries and exposes product availability', async () => {
    const productResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/products`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        title: 'Xbox Series X',
        brand: 'Microsoft',
        externalIdentifiers: [{ type: 'asin', value: 'B08H75RTZ8' }],
      })
      .expect(201);

    const warehouseResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/warehouses`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        code: 'GDL-01',
        name: 'Almacén Guadalajara',
        processingTimeDays: 2,
      })
      .expect(201);

    const productId = productResponse.body.data.id as string;
    const warehouseId = warehouseResponse.body.data.id as string;

    const entryResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/inventory/entries`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        productId,
        warehouseId,
        quantity: 10,
        unitCost: { amount: 9500, currency: 'MXN' },
        sourceReference: { type: 'purchase-order', id: 'PO-001' },
      })
      .expect(201);

    expect(entryResponse.body.data.type).toBe('entry');
    expect(entryResponse.body.data.quantity).toBe(10);
    expect(entryResponse.body.data.unitCost).toMatchObject({ amount: 9500, currency: 'MXN' });

    const availabilityResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/inventory/products/${productId}/availability`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(availabilityResponse.body.data).toMatchObject({
      productId,
      totalAvailableQuantity: 10,
      warehouses: [
        {
          warehouseId,
          availableQuantity: 10,
        },
      ],
    });
  });

  it('consumes FIFO stock, lists movements, and exposes lots', async () => {
    const productResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/products`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        title: 'Steam Deck OLED',
        brand: 'Valve',
        externalIdentifiers: [{ type: 'asin', value: 'B0STEAMDECK' }],
      })
      .expect(201);

    const warehouseResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/warehouses`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        code: 'QRO-01',
        name: 'Almacén Querétaro',
        processingTimeDays: 1,
      })
      .expect(201);

    const productId = productResponse.body.data.id as string;
    const warehouseId = warehouseResponse.body.data.id as string;

    await request(app.getHttpServer())
      .post(`${API_PREFIX}/inventory/entries`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        productId,
        warehouseId,
        quantity: 5,
        unitCost: { amount: 8800, currency: 'MXN' },
        sourceReference: { type: 'purchase-order', id: 'PO-100' },
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`${API_PREFIX}/inventory/entries`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        productId,
        warehouseId,
        quantity: 7,
        unitCost: { amount: 9100, currency: 'MXN' },
        sourceReference: { type: 'purchase-order', id: 'PO-101' },
      })
      .expect(201);

    const exitResponse = await request(app.getHttpServer())
      .post(`${API_PREFIX}/inventory/exits`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .send({
        productId,
        warehouseId,
        quantity: 6,
        reference: { type: 'order', id: 'ORD-01' },
      })
      .expect(201);

    expect(exitResponse.body.data.type).toBe('exit');
    expect(exitResponse.body.data.quantity).toBe(6);

    const availabilityResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/inventory/products/${productId}/availability`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(availabilityResponse.body.data.totalAvailableQuantity).toBe(6);
    expect(availabilityResponse.body.data.warehouses[0]).toMatchObject({
      warehouseId,
      availableQuantity: 6,
    });

    const lotsResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/inventory/products/${productId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(lotsResponse.body.data).toHaveLength(2);
    expect(lotsResponse.body.data[0].availableQuantity).toBe(0);
    expect(lotsResponse.body.data[1].availableQuantity).toBe(6);

    const lotId = lotsResponse.body.data[1].lotId as string;

    const lotResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/inventory/lots/${lotId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(lotResponse.body.data).toMatchObject({
      lotId,
      productId,
      warehouseId,
      availableQuantity: 6,
    });

    const movementsResponse = await request(app.getHttpServer())
      .get(`${API_PREFIX}/inventory/movements?productId=${productId}&warehouseId=${warehouseId}`)
      .set(API_KEY_HEADER, process.env.API_KEY as string)
      .expect(200);

    expect(movementsResponse.body.data).toHaveLength(3);
    expect(movementsResponse.body.meta.pagination.total).toBe(3);
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
