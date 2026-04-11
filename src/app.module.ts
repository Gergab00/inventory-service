import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigService } from './infrastructure/config/app-config.service';
import { validateEnvironment } from './infrastructure/config/env.validation';
import { MongoPersistenceModule } from './infrastructure/persistence/mongodb/mongodb.module';
import { ApiKeyGuard } from './interfaces/http/guards/api-key.guard';
import { ProductsModule } from './modules/products/products.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate: validateEnvironment,
    }),
    MongoPersistenceModule,
    ProductsModule,
    WarehousesModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppConfigService,
    ApiKeyGuard,
    {
      provide: APP_GUARD,
      useExisting: ApiKeyGuard,
    },
  ],
  exports: [AppConfigService],
})
export class AppModule {}
