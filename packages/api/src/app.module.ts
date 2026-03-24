import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

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
    // Feature modules will be added here as we build them
  ],
})
export class AppModule {}
