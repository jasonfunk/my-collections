import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * UsersModule owns profile data: who am I, update my details.
 * Imports AuthModule to get access to JwtAuthGuard (via TokenService)
 * and the User repository (via TypeOrmModule re-export).
 */
@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
