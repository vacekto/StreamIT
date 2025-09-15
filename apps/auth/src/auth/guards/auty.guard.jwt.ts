import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadExtended } from '../types/auth.types';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt') {
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
