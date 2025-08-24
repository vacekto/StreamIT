import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { AuthenticatedUser } from '../types/auth.types.authenticated-user';
import { JwtPayload } from '../types/auth.types.jwt-payload';

const cookieExtractor = (req: Request): string | null => {
  if (req && typeof req.cookies === 'object' && req.cookies) {
    const token = (req.cookies as Record<string, unknown>)['refresh_token'];
    if (typeof token === 'string') return token;
  }
  return null;
};

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  validate(req: Request, payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.id,
      username: payload.username,
      email: payload.email,
    };
  }
}
