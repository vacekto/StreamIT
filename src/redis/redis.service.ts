import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly tokenPath: string;
  private readonly sessionPath: string;
  private readonly refreshTtl: number;
  constructor(
    @Inject('REDIS_CLIENT') private readonly client: Redis,
    private configService: ConfigService,
  ) {
    this.tokenPath = this.configService.get<string>('REDIS_TOKEN_PATH')!;
    this.sessionPath = this.configService.get<string>('REDIS_SESSION_PATH')!;
    this.refreshTtl = +this.configService.get<number>('JWT_REFRESH_LIFETIME')!;
  }

  async registerToken(userId: string, tokenId: string) {
    const pipeline = this.client.multi();
    pipeline.set(`${this.tokenPath}:${tokenId}`, userId, 'EX', this.refreshTtl);
    pipeline.sadd(`${this.sessionPath}:${userId}`, tokenId);
    await pipeline.exec();
    await this.pruneTokens(userId);
  }

  tokenExists(tokenId: string) {
    return this.client.exists(`${this.tokenPath}:${tokenId}`);
  }

  async invalidateToken(tokenId: string, userId: string) {
    const pipeline = this.client.multi();
    pipeline.del(`${this.tokenPath}:${tokenId}`);
    pipeline.srem(`${this.sessionPath}:${userId}`, tokenId);
    await pipeline.exec();
  }

  private async pruneTokens(userId: string) {
    const tokenIds = await this.client.smembers(
      `${this.sessionPath}:${userId}`,
    );
    if (tokenIds.length === 0) return;

    const pipeline = this.client.multi();
    for (const id of tokenIds) {
      pipeline.exists(`${this.tokenPath}:${id}`);
    }
    const existsResults = await pipeline.exec();
    if (!existsResults) return;

    const removals: string[] = [];
    tokenIds.forEach((id, idx) => {
      if (existsResults[idx][1] === 0) removals.push(id);
    });

    if (removals.length > 0) {
      await this.client.srem(`${this.sessionPath}:${userId}`, removals);
    }
  }
  //   private async pruneRefreshTokens(userId: string) {
  //     const tokenIds = await this.client.smembers(`sessions:user:${userId}`);
  //     for (const id of tokenIds) {
  //       const exists = await this.client.exists(`auth:refresh:${id}`);
  //       if (!exists) await this.client.srem(`sessions:user:${userId}`, id);
  //     }
  //   }
}
