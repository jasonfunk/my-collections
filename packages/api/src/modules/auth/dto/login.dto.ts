import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
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
