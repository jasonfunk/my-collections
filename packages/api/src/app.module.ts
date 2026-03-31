import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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
        // Run pending migrations automatically when the app starts.
        migrationsRun: true,
        // Log SQL queries in development; silence in production.
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),

    // Feature modules will be added here as we build them
  ],
})
export class AppModule {}
