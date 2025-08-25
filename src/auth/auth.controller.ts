import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { RedisService } from 'src/redis/redis.service';
import { User } from '../user/entities/entity.user';
import { AuthService } from './auth.service';
import { ReqUser } from './decorators/auth.decorator.user';
import { LocalAuthGuard } from './guards/auth.guard.local-guard';
import { RedisTokenGuard } from './guards/auth.guard.redis-token';
import { JwtRefreshGuard } from './guards/auth.guard.refresh-jwt';
import { JwtAccessGuard } from './guards/auty.guard.jwt';
import { JwtPayloadExtended } from './types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @ReqUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = await this.authService.signAccessJwt(user);
    const refreshToken = await this.authService.signRefreshJwt(user);
    const resData = { access_token: accessToken.token };
    this.setRefreshTokenCookie(res, refreshToken.token);
    await this.redisService.registerToken(user.id, refreshToken.payload.tid);
    return resData;
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard, RedisTokenGuard)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @ReqUser() payload: JwtPayloadExtended,
  ) {
    await this.redisService.invalidateToken(payload.tid, payload.id);
    return { message: 'Logged out' };
  }

  @Get('test')
  @UseGuards(JwtAccessGuard)
  test() {
    return { result: 'hello from test' };
  }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  getUserData(@ReqUser() user: JwtPayloadExtended) {
    return user;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard, RedisTokenGuard)
  async regreshJwt(
    @ReqUser() payload: JwtPayloadExtended,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.redisService.invalidateToken(payload.tid, payload.id);
    const accessToken = await this.authService.signAccessJwt(payload);
    const refreshToken = await this.authService.signRefreshJwt(payload);
    this.setRefreshTokenCookie(res, refreshToken.token);
    await this.redisService.registerToken(
      refreshToken.payload.id,
      refreshToken.payload.tid,
    );
    const resData = { access_token: accessToken.token };
    return resData;
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie(this.configService.get('JWT_REFRESH_COOKIE')!, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: parseInt(this.configService.get('JWT_REFRESH_LIFETIME')!) * 1000,
    });
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie(this.configService.get('JWT_REFRESH_COOKIE')!, token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: parseInt(this.configService.get('JWT_REFRESH_LIFETIME')!) * 1000,
    });
  }
}
