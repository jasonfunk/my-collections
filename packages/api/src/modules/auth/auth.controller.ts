import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './services/auth.service';
import { LoginDto, RegisterDto, RevokeDto, TokenDto } from './dto/index.js';

// How long the refresh-token cookie lives in the browser (matches JWT_REFRESH_EXPIRES_IN).
// In production this should come from config; 30 days is a safe default.
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// ── Controller ─────────────────────────────────────────────────────────────

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Cookie helpers ─────────────────────────────────────────────────────

  /** Set the httpOnly refresh-token cookie on a response. */
  private setRefreshCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      // Require HTTPS in production; allow plain HTTP in development
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      // Path=/ is intentional: the Vite dev proxy rewrites /api → '', so the
      // browser sees the cookie path relative to localhost:5173 (not :3000).
      // Using / ensures the cookie is sent to both /api/auth/token and /api/auth/revoke.
      path: '/',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  /** Clear the refresh-token cookie. Options must match setRefreshCookie exactly. */
  private clearRefreshCookie(res: Response): void {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }

  // ── Routes ─────────────────────────────────────────────────────────────

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Email already registered' })
  @ApiResponse({ status: 403, description: 'Registration is disabled' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto.email, dto.password);
    return { id: user.id, email: user.email, isApproved: user.isApproved };
  }

  @Get('authorize')
  @ApiOperation({
    summary: 'Initiate OAuth2 Authorization Code Flow',
    description:
      'Validates the client and its request parameters. Returns session data ' +
      'for the client to include in the POST /auth/login call.',
  })
  @ApiQuery({ name: 'client_id', required: true })
  @ApiQuery({ name: 'redirect_uri', required: true })
  @ApiQuery({ name: 'code_challenge', required: true })
  @ApiQuery({ name: 'code_challenge_method', required: true, example: 'S256' })
  @ApiQuery({ name: 'scope', required: false, example: 'collections:read' })
  @ApiQuery({ name: 'state', required: true })
  async authorize(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('code_challenge') codeChallenge: string,
    @Query('code_challenge_method') codeChallengeMethod: string,
    @Query('scope') scope: string = '',
    @Query('state') state: string,
  ) {
    const scopes = scope ? scope.split(' ') : [];
    return this.authService.authorize(
      clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      scopes,
      state,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({
    summary: 'Submit credentials and receive authorization code redirect URL',
    description:
      'Verifies email/password. On success, returns a redirect URL with ' +
      'the authorization code as a query parameter. The client should redirect ' +
      'to this URL (or follow it in-app for SPAs/mobile).',
  })
  async login(@Body() dto: LoginDto) {
    const session = {
      clientId: dto.clientId,
      redirectUri: dto.redirectUri,
      codeChallenge: dto.codeChallenge,
      codeChallengeMethod: dto.codeChallengeMethod,
      scopes: dto.scopes,
      state: dto.state,
    };
    const redirectUrl = await this.authService.login(dto.email, dto.password, session);
    return { redirectUrl };
  }

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: 'Exchange authorization code or refresh token for tokens',
    description:
      '**authorization_code grant:** Exchange a code + code_verifier (PKCE) for an access token. ' +
      'The refresh token is returned as an httpOnly cookie, not in the response body.\n\n' +
      '**refresh_token grant:** Read the refresh token from the httpOnly cookie, rotate it, ' +
      'set a new cookie, and return a fresh access token.',
  })
  async token(
    @Body() dto: TokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (dto.grantType === 'authorization_code') {
      if (!dto.code || !dto.codeVerifier || !dto.redirectUri) {
        throw new BadRequestException('code, code_verifier, and redirect_uri are required for authorization_code grant');
      }
      const tokens = await this.authService.exchangeCode(dto.code, dto.codeVerifier, dto.clientId, dto.redirectUri);
      this.setRefreshCookie(res, tokens.refreshToken);
      // Mobile clients (no cookie support) receive the refresh token in the body.
      const isMobile = dto.clientId === 'mobile-app';
      return {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        ...(isMobile && { refreshToken: tokens.refreshToken }),
      };
    }

    if (dto.grantType === 'refresh_token') {
      // Read from cookie (web) — body fallback retained for future mobile support
      const rawToken = (req.cookies as Record<string, string>)['refresh_token'] ?? dto.refreshToken;
      if (!rawToken) {
        throw new BadRequestException('refresh_token cookie (or body field) is required for refresh_token grant');
      }
      const tokens = await this.authService.refresh(rawToken, dto.clientId);
      this.setRefreshCookie(res, tokens.refreshToken);
      return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
    }

    throw new BadRequestException(`Unsupported grant_type: ${dto.grantType}`);
  }

  @Post('revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the refresh token (logout)' })
  async revoke(
    @Body() dto: RevokeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Read from cookie (web) — body fallback for mobile/direct API clients
    const rawToken = (req.cookies as Record<string, string>)['refresh_token'] ?? dto.token;
    this.clearRefreshCookie(res);
    if (rawToken) {
      await this.authService.revoke(rawToken);
    }
  }
}
