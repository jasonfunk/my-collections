import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthorizationCode } from './entities/authorization-code.entity';
import { OAuthClient } from './entities/oauth-client.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenCleanupService } from './token-cleanup.service';
import { TokenService } from './services/token.service';

/**
 * AuthModule owns identity: registration, login, OAuth2 flows, tokens.
 * Exports TokenService and PasswordService so other modules can validate
 * tokens and hash passwords without importing AuthModule's internals.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, OAuthClient, AuthorizationCode, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, PasswordService, TokenCleanupService],
  exports: [TokenService, PasswordService, TypeOrmModule],
})
export class AuthModule {}
