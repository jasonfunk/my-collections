import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, IsNull, Repository } from 'typeorm';
import { AuthorizationCode } from './entities/authorization-code.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(AuthorizationCode)
    private readonly authCodeRepo: Repository<AuthorizationCode>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeExpiredTokens(): Promise<void> {
    const now = new Date();

    const { affected: tokensDeleted } = await this.refreshTokenRepo.delete([
      { expiresAt: LessThan(now) },
      { revokedAt: Not(IsNull()) },
    ]);

    const { affected: codesDeleted } = await this.authCodeRepo.delete([
      { expiresAt: LessThan(now) },
      { usedAt: Not(IsNull()) },
    ]);

    this.logger.log(
      `Token purge: removed ${tokensDeleted ?? 0} refresh token(s), ${codesDeleted ?? 0} authorization code(s)`,
    );
  }
}
