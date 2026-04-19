import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { User } from './entities/user.entity';
import { OAuthClient } from './entities/oauth-client.entity';
import { AuthorizationCode } from './entities/authorization-code.entity';
import { RefreshToken } from './entities/refresh-token.entity';

// ── Config ─────────────────────────────────────────────────────────────────

const testConfig: Record<string, string> = {
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars!!',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '30d',
  REGISTRATION_ENABLED: 'true',
};

const configServiceMock = {
  getOrThrow: (key: string) => {
    if (!(key in testConfig)) throw new Error(`Config key not found: ${key}`);
    return testConfig[key];
  },
  get: (key: string, fallback?: string) => testConfig[key] ?? fallback,
} as unknown as ConfigService;

// ── Factory helpers ────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'user-uuid-1234',
    email: 'test@example.com',
    passwordHash: 'placeholder',
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeClient(overrides: Partial<OAuthClient> = {}): OAuthClient {
  return Object.assign(new OAuthClient(), {
    id: 'client-uuid-1234',
    clientId: 'web-app',
    clientSecretHash: null,
    name: 'Web App',
    redirectUris: ['http://localhost:5173/callback'],
    allowedScopes: ['collections:read', 'collections:write'],
    ...overrides,
  });
}

function makeAuthCode(overrides: Partial<AuthorizationCode> = {}): AuthorizationCode {
  return Object.assign(new AuthorizationCode(), {
    id: 'code-uuid-1234',
    codeHash: 'some-hash',
    user: makeUser(),
    client: makeClient(),
    redirectUri: 'http://localhost:5173/callback',
    scopes: ['collections:read'],
    codeChallenge: 'placeholder-challenge',
    codeChallengeMethod: 'S256',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  });
}

function makeRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return Object.assign(new RefreshToken(), {
    id: 'rt-uuid-1234',
    tokenHash: 'rt-hash',
    user: makeUser(),
    client: makeClient(),
    scopes: ['collections:read'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  });
}

function generatePkce(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

// ── Mock repos ─────────────────────────────────────────────────────────────

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn((data: Partial<User>) => ({ ...data })),
  save: jest.fn(),
};

const mockClientRepo = {
  findOne: jest.fn(),
};

const mockAuthCodeRepo = {
  findOne: jest.fn(),
  create: jest.fn((data: Partial<AuthorizationCode>) => ({ ...data })),
  save: jest.fn(),
};

const mockRefreshTokenRepo = {
  findOne: jest.fn(),
  create: jest.fn((data: Partial<RefreshToken>) => ({ ...data })),
  save: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
};

// ── Suite ──────────────────────────────────────────────────────────────────

describe('AuthController — integration', () => {
  let app: INestApplication;
  let testPasswordHash: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        PasswordService,
        TokenService,
        { provide: ConfigService, useValue: configServiceMock },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(OAuthClient), useValue: mockClientRepo },
        { provide: getRepositoryToken(AuthorizationCode), useValue: mockAuthCodeRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepo },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const passwordService = moduleRef.get(PasswordService);
    testPasswordHash = await passwordService.hash('password123!');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    Object.assign(testConfig, {
      JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-chars',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars!!',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '30d',
      REGISTRATION_ENABLED: 'true',
    });
    jest.clearAllMocks();
    mockUserRepo.create.mockImplementation((data: Partial<User>) => ({ ...data }));
    mockAuthCodeRepo.create.mockImplementation((data: Partial<AuthorizationCode>) => ({ ...data }));
    mockRefreshTokenRepo.create.mockImplementation((data: Partial<RefreshToken>) => ({ ...data }));
    mockRefreshTokenRepo.update.mockResolvedValue({ affected: 1 });
    mockRefreshTokenRepo.find.mockResolvedValue([]);
  });

  // ── Register ─────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('returns 201 and user data on success', async () => {
      const user = makeUser({ passwordHash: testPasswordHash });
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue(user);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123!' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe('test@example.com');
    });

    it('returns 403 when registration is disabled', async () => {
      testConfig['REGISTRATION_ENABLED'] = 'false';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123!' })
        .expect(403);
    });

    it('returns 400 on duplicate email', async () => {
      mockUserRepo.findOne.mockResolvedValue(makeUser());

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123!' })
        .expect(400);
    });

    it('returns 400 when password is too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'short' })
        .expect(400);
    });
  });

  // ── Authorize ─────────────────────────────────────────────────────────────

  describe('GET /auth/authorize', () => {
    const baseParams = {
      client_id: 'web-app',
      redirect_uri: 'http://localhost:5173/callback',
      code_challenge: 'some-challenge',
      code_challenge_method: 'S256',
      state: 'random-state',
    };

    it('returns 200 with session data on valid request', async () => {
      mockClientRepo.findOne.mockResolvedValue(makeClient());

      const res = await request(app.getHttpServer())
        .get('/auth/authorize')
        .query(baseParams)
        .expect(200);

      expect(res.body.clientId).toBe('web-app');
      expect(res.body.state).toBe('random-state');
    });

    it('returns 404 for unknown client_id', async () => {
      mockClientRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/auth/authorize')
        .query({ ...baseParams, client_id: 'unknown-client' })
        .expect(404);
    });

    it('returns 400 for invalid redirect_uri', async () => {
      mockClientRepo.findOne.mockResolvedValue(makeClient());

      await request(app.getHttpServer())
        .get('/auth/authorize')
        .query({ ...baseParams, redirect_uri: 'http://evil.com/callback' })
        .expect(400);
    });

    it('returns 400 for code_challenge_method=plain', async () => {
      mockClientRepo.findOne.mockResolvedValue(makeClient());

      await request(app.getHttpServer())
        .get('/auth/authorize')
        .query({ ...baseParams, code_challenge_method: 'plain' })
        .expect(400);
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    const baseBody = {
      email: 'test@example.com',
      password: 'password123!',
      clientId: 'web-app',
      redirectUri: 'http://localhost:5173/callback',
      codeChallenge: 'some-challenge',
      codeChallengeMethod: 'S256',
      scopes: ['collections:read'],
      state: 'random-state',
    };

    it('returns 200 with redirectUrl containing auth code on success', async () => {
      mockUserRepo.findOne.mockResolvedValue(makeUser({ passwordHash: testPasswordHash }));
      mockClientRepo.findOne.mockResolvedValue(makeClient());
      mockAuthCodeRepo.save.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(baseBody)
        .expect(200);

      expect(res.body.redirectUrl).toMatch(/\?code=.+&state=random-state$/);
    });

    it('returns 401 for wrong password', async () => {
      mockUserRepo.findOne.mockResolvedValue(makeUser({ passwordHash: testPasswordHash }));

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...baseBody, password: 'wrongpassword' })
        .expect(401);
    });

    it('returns 403 for unapproved user', async () => {
      mockUserRepo.findOne.mockResolvedValue(
        makeUser({ passwordHash: testPasswordHash, isApproved: false }),
      );

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(baseBody)
        .expect(403);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);
    });
  });

  // ── Token ─────────────────────────────────────────────────────────────────

  describe('POST /auth/token', () => {
    it('returns 200, accessToken, and refresh cookie on authorization_code grant', async () => {
      const pkce = generatePkce();
      const rawCode = crypto.randomBytes(32).toString('hex');
      const user = makeUser({ passwordHash: testPasswordHash });
      const client = makeClient();

      mockAuthCodeRepo.findOne.mockResolvedValue(
        makeAuthCode({ codeChallenge: pkce.challenge, user, client }),
      );
      mockAuthCodeRepo.save.mockResolvedValue({});
      mockRefreshTokenRepo.save.mockImplementation((entity: RefreshToken) =>
        Promise.resolve(entity),
      );

      const res = await request(app.getHttpServer())
        .post('/auth/token')
        .send({
          grantType: 'authorization_code',
          code: rawCode,
          codeVerifier: pkce.verifier,
          clientId: 'web-app',
          redirectUri: 'http://localhost:5173/callback',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.expiresIn).toBe(900);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toMatch(/^refresh_token=/);
    });

    it('returns 401 for wrong code_verifier (PKCE mismatch)', async () => {
      const pkce = generatePkce();
      const rawCode = crypto.randomBytes(32).toString('hex');

      // Store code with a challenge that won't match 'bad-verifier'
      mockAuthCodeRepo.findOne.mockResolvedValue(
        makeAuthCode({ codeChallenge: pkce.challenge }),
      );

      await request(app.getHttpServer())
        .post('/auth/token')
        .send({
          grantType: 'authorization_code',
          code: rawCode,
          codeVerifier: 'bad-verifier',
          clientId: 'web-app',
          redirectUri: 'http://localhost:5173/callback',
        })
        .expect(401);
    });

    it('returns 401 for already-used code', async () => {
      const pkce = generatePkce();
      const rawCode = crypto.randomBytes(32).toString('hex');

      mockAuthCodeRepo.findOne.mockResolvedValue(
        makeAuthCode({ codeChallenge: pkce.challenge, usedAt: new Date() }),
      );

      await request(app.getHttpServer())
        .post('/auth/token')
        .send({
          grantType: 'authorization_code',
          code: rawCode,
          codeVerifier: pkce.verifier,
          clientId: 'web-app',
          redirectUri: 'http://localhost:5173/callback',
        })
        .expect(401);
    });

    it('returns 401 for expired code', async () => {
      const pkce = generatePkce();
      const rawCode = crypto.randomBytes(32).toString('hex');

      mockAuthCodeRepo.findOne.mockResolvedValue(
        makeAuthCode({
          codeChallenge: pkce.challenge,
          expiresAt: new Date(Date.now() - 1000),
        }),
      );

      await request(app.getHttpServer())
        .post('/auth/token')
        .send({
          grantType: 'authorization_code',
          code: rawCode,
          codeVerifier: pkce.verifier,
          clientId: 'web-app',
          redirectUri: 'http://localhost:5173/callback',
        })
        .expect(401);
    });

    it('returns 200 and rotates cookie on refresh_token grant', async () => {
      const rawRefreshToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      const user = makeUser();
      const client = makeClient();

      mockClientRepo.findOne.mockResolvedValue(client);
      mockRefreshTokenRepo.findOne.mockResolvedValue(
        makeRefreshToken({ tokenHash, user, client }),
      );
      mockRefreshTokenRepo.save.mockImplementation((entity: RefreshToken) =>
        Promise.resolve(entity),
      );

      const res = await request(app.getHttpServer())
        .post('/auth/token')
        .set('Cookie', `refresh_token=${rawRefreshToken}`)
        .send({ grantType: 'refresh_token', clientId: 'web-app' })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 400 for unsupported grantType', async () => {
      await request(app.getHttpServer())
        .post('/auth/token')
        .send({ grantType: 'client_credentials', clientId: 'web-app' })
        .expect(400);
    });
  });

  // ── Revoke ────────────────────────────────────────────────────────────────

  describe('POST /auth/revoke', () => {
    it('returns 204 and clears the refresh cookie', async () => {
      const rawRefreshToken = crypto.randomBytes(32).toString('hex');

      const res = await request(app.getHttpServer())
        .post('/auth/revoke')
        .set('Cookie', `refresh_token=${rawRefreshToken}`)
        .send({})
        .expect(204);

      const setCookie = (res.headers['set-cookie'] as unknown) as string[] | undefined;
      expect(setCookie?.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
      expect(mockRefreshTokenRepo.update).toHaveBeenCalled();
    });
  });
});
