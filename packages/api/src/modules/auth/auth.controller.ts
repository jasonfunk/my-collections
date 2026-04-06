import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { LoginDto, RegisterDto, RevokeDto, TokenDto } from './dto/index.js';

// ── Controller ─────────────────────────────────────────────────────────────

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
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
  @ApiOperation({
    summary: 'Exchange authorization code or refresh token for tokens',
    description:
      '**authorization_code grant:** Exchange a code + code_verifier (PKCE) for access + refresh tokens.\n\n' +
      '**refresh_token grant:** Rotate a refresh token for a new token pair.',
  })
  async token(@Body() dto: TokenDto) {
    if (dto.grantType === 'authorization_code') {
      if (!dto.code || !dto.codeVerifier || !dto.redirectUri) {
        throw new Error('code, code_verifier, and redirect_uri are required for authorization_code grant');
      }
      return this.authService.exchangeCode(dto.code, dto.codeVerifier, dto.clientId, dto.redirectUri);
    }

    if (dto.grantType === 'refresh_token') {
      if (!dto.refreshToken) {
        throw new Error('refresh_token is required for refresh_token grant');
      }
      return this.authService.refresh(dto.refreshToken, dto.clientId);
    }

    throw new Error(`Unsupported grant_type: ${dto.grantType}`);
  }

  @Post('revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a refresh token (logout)' })
  async revoke(@Body() dto: RevokeDto) {
    await this.authService.revoke(dto.token);
  }
}
