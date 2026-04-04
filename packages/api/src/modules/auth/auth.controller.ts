import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './services/auth.service';

// ── DTOs ───────────────────────────────────────────────────────────────────

class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'collector@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Password (minimum 8 characters)', example: 'hunter2hunter2' })
  @IsString()
  @MinLength(8)
  password!: string;
}

class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'collector@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password', example: 'hunter2hunter2' })
  @IsString()
  password!: string;

  @ApiProperty({ description: 'OAuth2 client identifier', example: 'web-app' })
  @IsString()
  clientId!: string;

  @ApiProperty({ description: 'Registered redirect URI', example: 'http://localhost:5173/callback' })
  @IsString()
  redirectUri!: string;

  @ApiProperty({ description: 'PKCE code challenge (Base64url SHA-256 of code_verifier)', example: 'abc123...' })
  @IsString()
  codeChallenge!: string;

  @ApiProperty({ description: 'PKCE code challenge method — only S256 supported', example: 'S256' })
  @IsString()
  codeChallengeMethod!: string;

  @ApiProperty({ description: 'Requested scopes', example: ['collections:read', 'collections:write'] })
  @IsString({ each: true })
  scopes!: string[];

  @ApiProperty({ description: 'Random state value for CSRF protection', example: 'randomstate123' })
  @IsString()
  state!: string;
}

class TokenDto {
  @ApiProperty({ description: 'Grant type', example: 'authorization_code', enum: ['authorization_code', 'refresh_token'] })
  @IsString()
  grantType!: string;

  @ApiProperty({ description: 'OAuth2 client identifier', example: 'web-app' })
  @IsString()
  clientId!: string;

  @ApiProperty({ description: 'Authorization code (authorization_code grant only)', example: 'abc123...', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'PKCE code verifier (authorization_code grant only)', example: 'verifier123...', required: false })
  @IsString()
  @IsOptional()
  codeVerifier?: string;

  @ApiProperty({ description: 'Redirect URI used in the authorize step (authorization_code grant only)', example: 'http://localhost:5173/callback', required: false })
  @IsString()
  @IsOptional()
  redirectUri?: string;

  @ApiProperty({ description: 'Refresh token (refresh_token grant only)', required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

class RevokeDto {
  @ApiProperty({ description: 'Refresh token to revoke' })
  @IsString()
  token!: string;
}

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
