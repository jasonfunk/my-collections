import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { OAuthClient } from '../entities/oauth-client.entity';
import { User } from '../entities/user.entity';
import { PasswordService } from './password.service';
import { TokenPair, TokenService } from './token.service';

export interface AuthorizeSession {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scopes: string[];
  state: string;
}

/**
 * Orchestrates the OAuth2 Authorization Code Flow with PKCE.
 *
 * Flow summary:
 *   1. Client calls /auth/authorize to validate itself and get a session token
 *   2. User POSTs credentials to /auth/login with the session token
 *   3. We verify credentials, store an auth code, redirect to client with code
 *   4. Client POSTs code + code_verifier to /auth/token — we verify PKCE, issue JWTs
 *   5. Client POSTs refresh token to /auth/token to rotate tokens
 *   6. Client POSTs refresh token to /auth/revoke to log out
 */
@Injectable()
export class AuthService {
  // Authorization codes expire in 10 minutes (OAuth2 spec recommends ≤10m)
  private readonly CODE_EXPIRY_MS = 10 * 60 * 1000;

  constructor(
    private readonly config: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(OAuthClient)
    private readonly clientRepo: Repository<OAuthClient>,
    @InjectRepository(AuthorizationCode)
    private readonly authCodeRepo: Repository<AuthorizationCode>,
  ) {}

  // ── Registration ───────────────────────────────────────────────────────────

  async register(email: string, password: string): Promise<User> {
    const enabled = this.config.get<string>('REGISTRATION_ENABLED', 'false');
    if (enabled !== 'true') {
      throw new ForbiddenException('Registration is currently disabled');
    }

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(password);
    const user = this.userRepo.create({ email, passwordHash });
    return this.userRepo.save(user);
  }

  // ── Authorize (step 1) ─────────────────────────────────────────────────────

  /**
   * Validates the OAuth2 client and its request parameters.
   * Returns a signed session token that the login endpoint will verify,
   * preventing CSRF on the login form.
   *
   * In a browser-based flow this would render an HTML login form.
   * Here we return the session data as JSON for the SPA/mobile to handle.
   */
  async authorize(
    clientId: string,
    redirectUri: string,
    codeChallenge: string,
    codeChallengeMethod: string,
    scopes: string[],
    state: string,
  ): Promise<AuthorizeSession> {
    const client = await this.findClientOrThrow(clientId);
    this.validateRedirectUri(client, redirectUri);
    this.validateScopes(client, scopes);

    if (codeChallengeMethod !== 'S256') {
      throw new BadRequestException('Only S256 code_challenge_method is supported');
    }

    return { clientId, redirectUri, codeChallenge, codeChallengeMethod, scopes, state };
  }

  // ── Login (step 2) ─────────────────────────────────────────────────────────

  /**
   * Verifies user credentials against an authorize session.
   * On success: creates an authorization code and returns the redirect URL.
   *
   * The auth code is stored as a SHA-256 hash — the raw code travels only
   * in the redirect URL and is never persisted. If someone gets the hash
   * from the DB, they can't reconstruct the code.
   */
  async login(
    email: string,
    password: string,
    session: AuthorizeSession,
  ): Promise<string> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !(await this.passwordService.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isApproved) {
      throw new ForbiddenException('Account pending approval');
    }

    const client = await this.findClientOrThrow(session.clientId);

    const rawCode = crypto.randomBytes(32).toString('hex');
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MS);

    const authCode = this.authCodeRepo.create({
      codeHash,
      user,
      client,
      redirectUri: session.redirectUri,
      scopes: session.scopes,
      codeChallenge: session.codeChallenge,
      codeChallengeMethod: session.codeChallengeMethod,
      expiresAt,
      usedAt: null,
    });
    await this.authCodeRepo.save(authCode);

    const params = new URLSearchParams({ code: rawCode, state: session.state });
    return `${session.redirectUri}?${params.toString()}`;
  }

  // ── Token exchange (step 3) ────────────────────────────────────────────────

  /**
   * Exchanges an authorization code for a token pair.
   * Verifies the PKCE code_verifier: SHA256(verifier) must equal the stored
   * code_challenge. This proves the caller started the auth flow.
   */
  async exchangeCode(
    rawCode: string,
    codeVerifier: string,
    clientId: string,
    redirectUri: string,
  ): Promise<TokenPair> {
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
    const authCode = await this.authCodeRepo.findOne({
      where: { codeHash },
      relations: ['user', 'client'],
    });

    if (!authCode) throw new UnauthorizedException('Invalid authorization code');
    if (authCode.usedAt) throw new UnauthorizedException('Authorization code already used');
    if (authCode.expiresAt < new Date()) throw new UnauthorizedException('Authorization code expired');
    if (authCode.client.clientId !== clientId) throw new UnauthorizedException('Client mismatch');
    if (authCode.redirectUri !== redirectUri) throw new UnauthorizedException('Redirect URI mismatch');

    // PKCE verification: SHA256(code_verifier) must equal code_challenge
    const expectedChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    if (expectedChallenge !== authCode.codeChallenge) {
      throw new UnauthorizedException('PKCE verification failed');
    }

    // Mark code as used (single-use enforcement)
    authCode.usedAt = new Date();
    await this.authCodeRepo.save(authCode);

    return this.tokenService.issueTokenPair(authCode.user, authCode.client, authCode.scopes);
  }

  // ── Refresh (step 4) ───────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string, clientId: string): Promise<TokenPair> {
    const client = await this.findClientOrThrow(clientId);
    return this.tokenService.rotateRefreshToken(rawRefreshToken, client);
  }

  // ── Revoke (logout) ────────────────────────────────────────────────────────

  async revoke(rawRefreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(rawRefreshToken);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async findClientOrThrow(clientId: string): Promise<OAuthClient> {
    const client = await this.clientRepo.findOne({ where: { clientId } });
    if (!client) throw new NotFoundException(`OAuth client '${clientId}' not found`);
    return client;
  }

  private validateRedirectUri(client: OAuthClient, redirectUri: string): void {
    if (!client.redirectUris.includes(redirectUri)) {
      throw new BadRequestException('Invalid redirect_uri');
    }
  }

  private validateScopes(client: OAuthClient, scopes: string[]): void {
    const invalid = scopes.filter((s) => !client.allowedScopes.includes(s));
    if (invalid.length > 0) {
      throw new BadRequestException(`Unsupported scopes: ${invalid.join(', ')}`);
    }
  }
}
