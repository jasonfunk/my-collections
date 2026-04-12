import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
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

// TokenService without DB — only testing the pure JWT methods
function makeService(configOverrides: Record<string, string> = {}): TokenService {
  const config = makeConfig(configOverrides);
  // Pass null for the repo — these tests only use the JWT methods
  return new TokenService(config, null as never);
}

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
