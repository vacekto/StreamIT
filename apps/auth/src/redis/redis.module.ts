import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: createRedisClient,
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}

function createRedisClient() {
  return new Redis({ host: 'redis', port: 6379 });
}
