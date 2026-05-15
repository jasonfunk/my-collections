import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNull } from 'typeorm';
import { TokenService } from './token.service';
import { OAuthClient } from '../entities/oauth-client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

// Minimal mock of ConfigService
function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const defaults: Record<string, string> = {
    JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-chars',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-chars',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
    ...overrides,
  };
  return {
    getOrThrow: (key: string) => {
      if (!(key in defaults)) throw new Error(`Config key not found: ${key}`);
      return defaults[key];
    },
    get: (key: string, fallback?: string) => defaults[key] ?? fallback,
  } as unknown as ConfigService;
}

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'user-uuid-1234',
    email: 'collector@example.com',
    passwordHash: 'irrelevant',
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
    allowedScopes: ['collections:read'],
    ...overrides,
  });
}

function makeRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return Object.assign(new RefreshToken(), {
    id: 'rt-uuid-1234',
    tokenHash: 'placeholder-hash',
    user: makeUser(),
    client: makeClient(),
    scopes: ['collections:read'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  });
}

// TokenService without DB — only testing the pure JWT methods
function makeService(configOverrides: Record<string, string> = {}): TokenService {
  const config = makeConfig(configOverrides);
  // Pass null for the repo — these tests only use the JWT methods
  return new TokenService(config, null as never);
}

// TokenService with a mocked repo — for rotation tests
function makeServiceWithRepo(
  repo: Record<string, jest.Mock>,
  configOverrides: Record<string, string> = {},
): TokenService {
  return new TokenService(makeConfig(configOverrides), repo as never);
}

// ── Access token tests ──────────────────────────────────────────────────────

describe('TokenService — access tokens', () => {
  it('signs and verifies a valid access token', () => {
    const service = makeService();
    const user = makeUser();
    const token = service.signAccessToken(user);
    const payload = service.verifyAccessToken(token);
    expect(payload.sub).toBe(user.id);
    expect(payload.email).toBe(user.email);
  });

  it('throws UnauthorizedException for a tampered token', () => {
    const service = makeService();
    const user = makeUser();
    const token = service.signAccessToken(user);
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(() => service.verifyAccessToken(tampered)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for a token signed with a different secret', () => {
    const signer = makeService({ JWT_ACCESS_SECRET: 'secret-a-padded-to-at-least-32-characters' });
    const verifier = makeService({ JWT_ACCESS_SECRET: 'secret-b-padded-to-at-least-32-characters' });
    const user = makeUser();
    const token = signer.signAccessToken(user);
    expect(() => verifier.verifyAccessToken(token)).toThrow(UnauthorizedException);
  });

  it('returns correct expiresIn for 15m', () => {
    const service = makeService({ JWT_ACCESS_EXPIRES_IN: '15m' });
    expect(service.accessTokenExpiresInSeconds()).toBe(900);
  });

  it('returns correct expiresIn for 1h', () => {
    const service = makeService({ JWT_ACCESS_EXPIRES_IN: '1h' });
    expect(service.accessTokenExpiresInSeconds()).toBe(3600);
  });
});

// ── Refresh token rotation tests ────────────────────────────────────────────

describe('TokenService — refresh token rotation', () => {
  let mockRepo: { findOne: jest.Mock; save: jest.Mock; find: jest.Mock; update: jest.Mock; create: jest.Mock };
  let service: TokenService;
  const client = makeClient();
  const user = makeUser();

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      create: jest.fn((data: Partial<RefreshToken>) => Object.assign(new RefreshToken(), data)),
    };
    service = makeServiceWithRepo(mockRepo);
  });

  it('rotates successfully: revokes old token and returns a new pair', async () => {
    const existing = makeRefreshToken({ user, client });
    mockRepo.findOne.mockResolvedValue(existing);
    mockRepo.save.mockImplementation((entity: RefreshToken) => Promise.resolve(entity));

    const result = await service.rotateRefreshToken('raw-token-value', client);

    // Old token must be revoked
    const [savedOld] = mockRepo.save.mock.calls[0] as [RefreshToken];
    expect(savedOld.revokedAt).not.toBeNull();

    // New pair returned
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.expiresIn).toBe(900);
  });

  it('detects reuse: revokes all tokens for the original client and throws 401', async () => {
    const alreadyRevoked = makeRefreshToken({ user, client, revokedAt: new Date() });
    const activeToken = makeRefreshToken({ user, client });
    mockRepo.findOne.mockResolvedValue(alreadyRevoked);
    // find() is called by revokeAllForUserAndClient
    mockRepo.find.mockResolvedValue([activeToken]);
    mockRepo.save.mockResolvedValue({});

    await expect(service.rotateRefreshToken('stolen-token', client)).rejects.toThrow(
      UnauthorizedException,
    );

    // Revocation must use the ORIGINAL client (existing.client.id), not the requesting client
    expect(mockRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          client: { id: alreadyRevoked.client.id },
          revokedAt: IsNull(),
        }),
      }),
    );
  });

  it('throws 401 for an expired refresh token', async () => {
    const expired = makeRefreshToken({ user, client, expiresAt: new Date(Date.now() - 1000) });
    mockRepo.findOne.mockResolvedValue(expired);

    await expect(service.rotateRefreshToken('raw-token', client)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('throws 401 when the refresh token is not found', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(service.rotateRefreshToken('unknown-token', client)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws 401 when the client does not match the token issuer', async () => {
    const otherClient = makeClient({ id: 'other-client-uuid', clientId: 'mobile-app' });
    const existing = makeRefreshToken({ user, client: otherClient });
    mockRepo.findOne.mockResolvedValue(existing);

    await expect(service.rotateRefreshToken('raw-token', client)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
