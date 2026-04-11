import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers — sets X-Frame-Options, X-Content-Type-Options,
  // Strict-Transport-Security, Content-Security-Policy, and others.
  // Must be applied before any route handlers.
  app.use(helmet());

  // Global validation — automatically validates incoming request bodies
  // against DTO class definitions (similar to Java Bean Validation / C# DataAnnotations)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global serialization — enables @Exclude() / @Expose() from class-transformer on entities.
  // Any entity property decorated with @Exclude() will be stripped from all responses.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // CORS — restrict to explicitly allowed origins (set via ALLOWED_ORIGINS env var).
  // Defaults to the Vite dev server if the var is absent.
  // In production, set ALLOWED_ORIGINS to the deployed frontend URL(s).
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Swagger API documentation — auto-generated from decorators
  // Available at http://localhost:3000/api/docs
  const config = new DocumentBuilder()
    .setTitle('My Collections API')
    .setDescription('API for tracking personal toy collections')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
