import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { JwtPayloadExtended } from '../types/auth.types';

@Injectable()
export class RedisTokenGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const payload = request.user as JwtPayloadExtended | undefined;

    if (!payload) {
      throw new UnauthorizedException('NO_USER_PAYLOAD');
    }

    const exists = await this.redisService.tokenExists(payload.tid);
    if (!exists) {
      throw new UnauthorizedException('TOKEN_REVOKED');
      // TODO: send email to user that account has been compromised
    }

    return true;
  }
}
