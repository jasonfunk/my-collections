import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DeviceToken } from './entities/device-token.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * UsersModule owns profile data: who am I, update my details.
 * Imports AuthModule to get access to JwtAuthGuard (via TokenService)
 * and the User repository (via TypeOrmModule re-export).
 */
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([DeviceToken])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
