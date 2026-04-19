import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PhotosController } from './photos.controller';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TokenService } from '../../auth/services/token.service';
import { User } from '../../auth/entities/user.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { fileTypeFromBuffer } from './__mocks__/file-type';

jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

// ── Config ─────────────────────────────────────────────────────────────────

const configServiceMock = {
  getOrThrow: (key: string) => {
    const cfg: Record<string, string> = {
      JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-chars',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars!!',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '30d',
    };
    if (!(key in cfg)) throw new Error(`Config key not found: ${key}`);
    return cfg[key];
  },
  get: (key: string, fallback?: string) => {
    const cfg: Record<string, string> = {
      JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-chars',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars!!',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '30d',
    };
    return cfg[key] ?? fallback;
  },
} as unknown as ConfigService;

const mockRefreshTokenRepo = {
  findOne: jest.fn(),
  create: jest.fn((data: Partial<RefreshToken>) => ({ ...data })),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
};

// ── Suite ──────────────────────────────────────────────────────────────────

describe('PhotosController — upload validation', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PhotosController],
      providers: [
        JwtAuthGuard,
        TokenService,
        { provide: ConfigService, useValue: configServiceMock },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepo },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Generate a valid access token using the real TokenService
    const tokenService = moduleRef.get(TokenService);
    const testUser = Object.assign(new User(), {
      id: 'user-uuid-test',
      email: 'uploader@example.com',
    });
    accessToken = tokenService.signAccessToken(testUser);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (fileTypeFromBuffer as jest.Mock).mockReset();
  });

  // ── Auth enforcement ──────────────────────────────────────────────────────

  it('returns 401 when no Authorization header is provided', async () => {
    await request(app.getHttpServer())
      .post('/collections/photos/upload')
      .attach('file', Buffer.from('fake'), 'test.jpg')
      .expect(401);
  });

  it('returns 401 for an invalid JWT', async () => {
    await request(app.getHttpServer())
      .post('/collections/photos/upload')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .attach('file', Buffer.from('fake'), 'test.jpg')
      .expect(401);
  });

  // ── Missing file ──────────────────────────────────────────────────────────

  it('returns 400 when no file is attached', async () => {
    await request(app.getHttpServer())
      .post('/collections/photos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  // ── Valid MIME types ──────────────────────────────────────────────────────

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/gif', 'gif'],
  ])('returns 201 for valid %s upload', async (mime, ext) => {
    (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime, ext });

    const res = await request(app.getHttpServer())
      .post('/collections/photos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.alloc(100), `image.${ext}`)
      .expect(201);

    expect(res.body.url).toMatch(new RegExp(`^/collections/photos/[a-f0-9]{32}\\.${ext}$`));
  });

  // ── Rejected MIME types ───────────────────────────────────────────────────

  it.each([
    ['application/pdf', 'pdf'],
    ['text/html', 'html'],
    ['application/javascript', 'js'],
  ])('returns 400 for disallowed %s file', async (mime, ext) => {
    (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime, ext });

    await request(app.getHttpServer())
      .post('/collections/photos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.alloc(100), `file.${ext}`)
      .expect(400);
  });

  it('returns 400 when file type is undetectable', async () => {
    (fileTypeFromBuffer as jest.Mock).mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/collections/photos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.alloc(100), 'unknown.bin')
      .expect(400);
  });

  // ── Size limit ────────────────────────────────────────────────────────────

  it('returns 413 for files exceeding 10 MB', async () => {
    const overLimit = Buffer.alloc(10 * 1024 * 1024 + 1);

    await request(app.getHttpServer())
      .post('/collections/photos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', overLimit, 'big.jpg')
      .expect(413);
  });

  // ── Path traversal ────────────────────────────────────────────────────────

  it('returns 404 for GET with path-traversal filename', async () => {
    await request(app.getHttpServer())
      .get('/collections/photos/../etc/passwd')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
