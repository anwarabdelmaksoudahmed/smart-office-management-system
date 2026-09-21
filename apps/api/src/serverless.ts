import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

let cachedServer: express.Express | null = null;

async function createServer(): Promise<express.Express> {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { bufferLogs: true },
  );

  const config = app.get(ConfigService);
  const prefix = config.getOrThrow<string>('app.prefix');
  const corsOrigins = config.getOrThrow<string[]>('app.corsOrigins');

  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Smart Office Café & Gaming API')
      .setDescription('Enterprise REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.init();
  cachedServer = expressApp;
  return expressApp;
}

export default async function handler(req: Request, res: Response) {
  const server = await createServer();
  return server(req, res);
}
