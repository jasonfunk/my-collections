import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { IsNull, Repository } from 'typeorm';
import { OAuthClient } from '../entities/oauth-client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/**
 * Manages JWT access tokens and refresh token lifecycle.
 *
 * Access tokens:
 *   - Short-lived JWTs (15 minutes by default)
 *   - Self-contained: the resource server verifies them by checking the
 *     signature — no database lookup on every request
 *   - Stored in memory by the client (never in localStorage)
 *
 * Refresh tokens:
 *   - Long-lived opaque tokens (30 days)
 *   - Stored as SHA-256 hashes in the database (raw token never persisted)
 *   - Rotation: using a refresh token invalidates it and issues a new one
 *   - If an attacker uses a stolen refresh token, the legitimate user's
 *     next refresh fails → forced re-login
 *
 * Analogous to a token factory in Spring Security OAuth2.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {
    // Fail fast at startup if JWT secrets are absent or too short.
    // 32 hex chars = 16 bytes of entropy — the practical minimum for HS256.
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    if (accessSecret.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
    }
    if (refreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
    }
  }

  // ── Access tokens ──────────────────────────────────────────────────────────

  signAccessToken(user: User): string {
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const expiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');

    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
    };

    return jwt.sign(payload, secret, { expiresIn, algorithm: 'HS256' } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    try {
      return jwt.verify(token, secret, { algorithms: ['HS256'] }) as AccessTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  accessTokenExpiresInSeconds(): number {
    const raw = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    return this.parseExpiry(raw);
  }

  // ── Refresh tokens ─────────────────────────────────────────────────────────

  async issueTokenPair(user: User, client: OAuthClient, scopes: string[]): Promise<TokenPair> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresInDays = parseInt(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30').replace('d', ''),
      10,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const refreshToken = this.refreshTokenRepo.create({
      tokenHash,
      user,
      client,
      scopes,
      expiresAt,
      revokedAt: null,
    });
    await this.refreshTokenRepo.save(refreshToken);

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: rawToken,
      expiresIn: this.accessTokenExpiresInSeconds(),
    };
  }

  /**
   * Rotates a refresh token: revokes the current one and issues a new pair.
   * Throws if the token is not found, expired, or already revoked.
   */
  async rotateRefreshToken(rawToken: string, client: OAuthClient): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawToken);
    const existing = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: { user: true, client: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Refresh token not found');
    }
    if (existing.revokedAt !== null) {
      // Token reuse detected — a rotated token was used again.
      // This likely means the token was stolen. Revoke all tokens for this user/client.
      await this.revokeAllForUserAndClient(existing.user.id, client.id);
      throw new UnauthorizedException('Refresh token already used — possible token theft');
    }
    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    if (existing.client.id !== client.id) {
      throw new UnauthorizedException('Refresh token was not issued to this client');
    }

    // Revoke the old token
    existing.revokedAt = new Date();
    await this.refreshTokenRepo.save(existing);

    // Issue a new pair
    return this.issueTokenPair(existing.user, client, existing.scopes);
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshTokenRepo.update({ tokenHash }, { revokedAt: new Date() });
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private async revokeAllForUserAndClient(userId: string, clientId: string): Promise<void> {
    const tokens = await this.refreshTokenRepo.find({
      where: { user: { id: userId }, client: { id: clientId }, revokedAt: IsNull() },
      relations: { user: true, client: true },
    });
    for (const token of tokens) {
      if (!token.revokedAt) {
        token.revokedAt = new Date();
      }
    }
    await this.refreshTokenRepo.save(tokens);
  }

  private parseExpiry(expiry: string): number {
    if (expiry.endsWith('m')) return parseInt(expiry) * 60;
    if (expiry.endsWith('h')) return parseInt(expiry) * 3600;
    if (expiry.endsWith('d')) return parseInt(expiry) * 86400;
    return parseInt(expiry);
  }
}
