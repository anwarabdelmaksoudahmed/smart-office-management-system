import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  appConfig,
  jwtConfig,
  redisConfig,
  throttleConfig,
  validateEnv,
} from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnv,
      load: [appConfig, jwtConfig, redisConfig, throttleConfig],
    }),
  ],
})
export class AppConfigModule {}
