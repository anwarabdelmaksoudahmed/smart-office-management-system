import { registerAs } from '@nestjs/config';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @IsOptional()
  API_PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  API_PREFIX!: string;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  REDIS_URL: string = 'memory://';

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_TTL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_TTL!: string;

  @IsInt()
  @Min(1)
  THROTTLE_TTL!: number;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT!: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3000', 10),
  prefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? 'memory://',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));
