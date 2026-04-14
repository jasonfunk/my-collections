import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // NestExpressApplication type is required in NestJS 11 + npm workspaces: the
  // PackageLoader auto-detection for @nestjs/platform-express does not cross
  // workspace node_modules boundaries, so we pin the platform explicitly.
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers — sets X-Frame-Options, X-Content-Type-Options,
  // Strict-Transport-Security, Content-Security-Policy, and others.
  // Must be applied before any route handlers.
  app.use(helmet());

  // Cookie parser — required to read httpOnly refresh-token cookies in auth routes.
  app.use(cookieParser());

  // Global validation — automatically validates incoming request bodies
  // against DTO class definitions (similar to Java Bean Validation / C# DataAnnotations)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip properties not in the DTO
      forbidNonWhitelisted: true, // reject (400) requests with extra properties
      transform: true,           // auto-cast primitives to DTO types
    }),
  );

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

  // Swagger API documentation — development only.
  // In production (NODE_ENV=production) this block is skipped entirely,
  // so /api/docs returns 404 and the full API schema is not exposed.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('My Collections API')
      .setDescription('API for tracking personal toy collections')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
