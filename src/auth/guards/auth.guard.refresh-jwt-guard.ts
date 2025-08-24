import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshStrategyGuard extends AuthGuard('jwt-refresh') {}
