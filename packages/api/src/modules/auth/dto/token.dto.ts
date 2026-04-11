import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class TokenDto {
  @ApiProperty({ description: 'Grant type', example: 'authorization_code', enum: ['authorization_code', 'refresh_token'] })
  @IsEnum(['authorization_code', 'refresh_token'])
  grantType!: 'authorization_code' | 'refresh_token';

  @ApiProperty({ description: 'OAuth2 client identifier', example: 'web-app' })
  @IsString()
  clientId!: string;

  @ApiProperty({ description: 'Authorization code (authorization_code grant only)', example: 'abc123...', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: 'PKCE code verifier (authorization_code grant only)', example: 'verifier123...', required: false })
  @IsOptional()
  @IsString()
  codeVerifier?: string;

  @ApiProperty({ description: 'Redirect URI used in the authorize step (authorization_code grant only)', example: 'http://localhost:5173/callback', required: false })
  @IsOptional()
  @IsString()
  redirectUri?: string;

  @ApiProperty({ description: 'Refresh token (refresh_token grant only)', required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
