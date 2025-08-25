import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { JwtPayloadExtended } from '../types/auth.types';

const cookieExtractor = (req: Request): string | null => {
  if (req && typeof req.cookies === 'object' && req.cookies) {
    const token = (req.cookies as Record<string, unknown>)['REFRESH_TOKEN'];
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

  validate(_req: Request, payload: JwtPayloadExtended): JwtPayloadExtended {
    return payload;
  }
}
