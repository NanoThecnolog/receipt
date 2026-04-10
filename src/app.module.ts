import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReceiptService } from './modules/receipt/receipt.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MonthlyJob } from './modules/jobs/monthly.job';
import { RedisIdService } from './services/utils/redis-id.service';
import { RedisModule } from './infra/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    RedisModule
  ],
  controllers: [AppController],
  providers: [AppService, ReceiptService, MonthlyJob, RedisIdService],
})
export class AppModule { }
