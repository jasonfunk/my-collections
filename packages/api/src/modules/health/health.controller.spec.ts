import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import helmet from 'helmet';
import { HealthController } from './health.controller.js';

describe('HealthController — security headers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: getDataSourceToken(), useValue: { isInitialized: true } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(helmet());
    await app.init();
  });

  afterAll(() => app.close());

  it('sets security headers on all responses', async () => {
    const { headers } = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-dns-prefetch-control']).toBe('off');
    expect(headers['strict-transport-security']).toMatch(/max-age=/);
    expect(headers['content-security-policy']).toBeDefined();
  });
});
