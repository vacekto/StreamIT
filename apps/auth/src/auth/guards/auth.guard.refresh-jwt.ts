import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { RedisService } from '../../redis/redis.service';
import { JwtPayloadExtended } from '../types/auth.types';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  handleRequest(
    err: Error | null,
    payload: JwtPayloadExtended | null,
    info: JsonWebTokenError | TokenExpiredError | undefined,
    _context: ExecutionContext,
  ): any {
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('TOKEN_EXPIRED');
    }
    if (err || !payload) {
      throw err || new UnauthorizedException('UNAUTHORIZED');
    }

    return payload;
  }
}
