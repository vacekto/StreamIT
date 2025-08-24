import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { User } from '../user/entities/entity.user';
import { AuthService } from './auth.service';
import { ReqUser } from './decorators/auth.decorator.user';
import { LocalAuthGuard } from './guards/auth.guard.local-guard';
import { JwtRefreshStrategyGuard } from './guards/auth.guard.refresh-jwt-guard';
import { JwtAuthGuard } from './guards/auty.guard.jwt-guard';
import { AuthenticatedUser } from './types/auth.types.authenticated-user';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @ReqUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = await this.authService.signAccessJwt(user);
    const refreshToken = await this.authService.signRefreshJwt(user);
    const resData = { access_token: accessToken };

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return resData;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getUserData(@ReqUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('refresh')
  @UseGuards(JwtRefreshStrategyGuard)
  async regreshJwt(
    @ReqUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = await this.authService.signAccessJwt(user);
    const refreshToken = await this.authService.signRefreshJwt(user);
    const resData = { access_token: accessToken };

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return resData;
  }
}
