import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('SmartOfficeAPI', {
              prettyPrint: true,
              colors: true,
            }),
          ),
        }),
      ],
    }),
  });

  const config = app.get(ConfigService);
  const prefix = config.getOrThrow<string>('app.prefix');
  const port = config.getOrThrow<number>('app.port');
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smart Office Café & Gaming API')
    .setDescription(
      'Enterprise REST API — Auth, RBAC, Orders, Inventory, Gaming',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Roles')
    .addTag('Permissions')
    .addTag('Categories')
    .addTag('Menu')
    .addTag('Recipes')
    .addTag('Ingredients')
    .addTag('Orders')
    .addTag('Inventory')
    .addTag('Suppliers')
    .addTag('Purchases')
    .addTag('Waste')
    .addTag('Gaming')
    .addTag('Reservations')
    .addTag('Employees')
    .addTag('Dashboard')
    .addTag('Reports')
    .addTag('Settings')
    .addTag('Audit')
    .addTag('Health')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`API listening on http://localhost:${port}/${prefix}`);
  logger.log(`Swagger UI at http://localhost:${port}/api/docs`);
}

bootstrap();
