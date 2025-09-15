import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigurationModule } from './config/config.module';
import DatabaseModule from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AuthModule,
    RedisModule,
    UserModule,
    RedisModule,
    DatabaseModule,
    ConfigurationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
