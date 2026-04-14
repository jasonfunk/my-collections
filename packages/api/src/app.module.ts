import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { UsersModule } from './modules/users/users.module';

/**
 * AppModule is the root module — the entry point of the NestJS dependency
 * injection container. Think of it like the ApplicationContext in Spring Boot
 * or the Startup class in ASP.NET Core.
 *
 * As we add features, we'll import their feature modules here:
 *   - CollectionsModule (items CRUD)
 *   - AuthModule (OAuth2)
 *   - UsersModule
 *   - etc.
 */
@Module({
  imports: [
    // Makes .env variables available via ConfigService throughout the app
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting — global default: 100 requests per 60 seconds per IP.
    // Auth endpoints override this with tighter limits via @Throttle() decorators.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Database connection — forRootAsync lets us read config from ConfigService
    // (which in turn reads from .env via ConfigModule above).
    // forRoot vs forRootAsync: forRoot takes a plain object; forRootAsync
    // accepts a factory function that runs after the DI container is ready,
    // so ConfigService is available to inject.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        // Never use synchronize: true — it auto-modifies the schema on startup,
        // which is destructive in production and masks migration errors in dev.
        synchronize: false,
        // Auto-run migrations in development only. In production, run
        // migrations explicitly before starting the app (see runbook).
        migrationsRun: process.env.NODE_ENV !== 'production',
        // Log SQL queries in development; silence in production.
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),

    AuthModule,
    UsersModule,
    CollectionsModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally so every route is rate-limited by default.
    // Individual routes can override with @Throttle() or opt out with @SkipThrottle().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
