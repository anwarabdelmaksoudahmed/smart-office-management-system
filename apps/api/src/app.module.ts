import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/services/redis.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { HealthModule } from './health/health.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MenuModule } from './modules/menu/menu.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { WasteModule } from './modules/waste/waste.module';
import { GamingModule } from './modules/gaming/gaming.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RedisModule,
    AuditLogsModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>('throttle.ttl') * 1000,
          limit: config.getOrThrow<number>('throttle.limit'),
        },
      ],
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CategoriesModule,
    MenuModule,
    RecipesModule,
    IngredientsModule,
    InventoryModule,
    SuppliersModule,
    PurchasesModule,
    WasteModule,
    GamingModule,
    ReservationsModule,
    EmployeesModule,
    OrdersModule,
    DashboardModule,
    ReportsModule,
    SettingsModule,
    HealthModule,
    RealtimeModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
