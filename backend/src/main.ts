import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { startWorker } from './worker';

async function bootstrap() {
  const logger = new Logger('VivoQuestBootstrap');

  // If worker mode is specified, start the asynchronous queue worker
  if (process.env.APP_MODE === 'worker') {
    await startWorker();
    return;
  }

  const fastifyAdapter = new FastifyAdapter({
    logger: false,
    bodyLimit: 10485760 // 10MB limit
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter
  );

  // Security headers & CORS
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false
  });

  await app.register(fastifyCors as any, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key', 'Accept']
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false
  }));

  // OpenAPI 3.1 Swagger Specification
  const swaggerConfig = new DocumentBuilder()
    .setTitle('VivoQuest Enterprise Healthcare Platform API')
    .setDescription('Versioned REST API specification for VivoQuest - Built with Node.js 22, TypeScript, NestJS and MongoDB Atlas')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '15-minute access JWT token from POST /v1/auth/otp/verify'
      },
      'bearer'
    )
    .addServer('http://localhost:8080', 'Local Development Server')
    .addServer('https://api.stage.vivoquest.in', 'Staging Environment (asia-south1)')
    .addServer('https://api.vivoquest.in', 'Production (asia-south1 Mumbai)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(process.env.PORT || '8080', 10);
  const host = '0.0.0.0';

  try {
    await app.listen(port, host);
    logger.log(`VivoQuest API Modular Monolith running at http://${host}:${port}`);
    logger.log(`OpenAPI 3.1 Contract Explorer available at http://${host}:${port}/docs`);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = port + 1;
      logger.warn(`Port ${port} is already in use, starting on fallback port ${fallbackPort}...`);
      await app.listen(fallbackPort, host);
      logger.log(`VivoQuest API Modular Monolith running at http://${host}:${fallbackPort}`);
      logger.log(`OpenAPI 3.1 Contract Explorer available at http://${host}:${fallbackPort}/docs`);
    } else {
      throw err;
    }
  }
}

bootstrap().catch((err) => {
  console.error('Fatal error during VivoQuest startup:', err);
  process.exit(1);
});
