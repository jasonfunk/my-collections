import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation — automatically validates incoming request bodies
  // against DTO class definitions (similar to Java Bean Validation / C# DataAnnotations)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS — allow the web app and mobile app to call the API
  app.enableCors();

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
