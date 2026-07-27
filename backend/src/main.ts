import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';
import { TrpcService } from './trpc/trpc.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://192.168.1.151:3000'
    ],
    credentials: true,
  });

  // Use cookie parser
  app.use(cookieParser());

  // Global validation pipe using Zod
  app.useGlobalPipes(new ZodValidationPipe());

  // Apply tRPC middleware
  const trpcService = app.get(TrpcService);
  trpcService.applyMiddleware(app);

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Togedo API')
    .setDescription('The Togedo task management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start the server
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
