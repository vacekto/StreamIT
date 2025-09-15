import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { RedisService } from '../redis/redis.service';
import { User } from '../user/entities/entity.user';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { ReqUser } from './decorators/auth.decorator.user';
import { LocalAuthGuard } from './guards/auth.guard.local-guard';
import { RedisTokenGuard } from './guards/auth.guard.redis-token';
import { JwtRefreshGuard } from './guards/auth.guard.refresh-jwt';
import { JwtAccessGuard } from './guards/auty.guard.jwt';
import { JwtPayloadExtended } from './types/auth.types';

@Controller('auth')
export class AuthController {
  private appOrigin: string;
  private host: string;
  private port: string;
  private isProd: boolean;
  private jwtRefreshLifetime: number;
  private cookieJwtName: string;
  private googleRedirectUri: string;
  private googleClientId: string;
  private googleClientSecret: string;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private redisService: RedisService,
    private userService: UserService,
  ) {
    this.appOrigin = this.configService.get('APP_ORIGIN')!;
    this.host = this.configService.get('HOST')!;
    this.port = this.configService.get('PORT')!;
    this.isProd = this.configService.get('NODE_ENV') === 'production';
    this.jwtRefreshLifetime = parseInt(
      this.configService.get('JWT_REFRESH_LIFETIME')!,
    );
    this.cookieJwtName = this.configService.get('JWT_REFRESH_COOKIE')!;
    this.googleRedirectUri = `${this.isProd ? 'https' : 'http'}://${this.host}:${this.port}/auth/google/callback`;
    this.googleClientId = this.configService.get('GOOGLE_CLIENT_ID')!;
    this.googleClientSecret = this.configService.get('GOOGLE_CLIENT_SECRET')!;
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie(this.cookieJwtName, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'strict',
      path: '/auth',
      maxAge: this.jwtRefreshLifetime * 1000,
    });
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie(this.cookieJwtName, token, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'strict',
      path: '/auth',
      maxAge: this.jwtRefreshLifetime * 1000,
    });
  }

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
    this.clearRefreshTokenCookie(res);
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

  @Get('google')
  redirectToGoogle(@Res() res: Response) {
    const url = this.authService.getGoogleAuthUrl();
    res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.googleClientId,
        client_secret: this.googleClientSecret,
        redirect_uri: this.googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Failed to fetch token: ${tokenRes.statusText}`);
    }

    const tokenData = await tokenRes.json();
    const { id_token } = tokenData;
    const ticket = await this.authService.verifyGoogleIdToken(id_token);
    const email = ticket.email;

    const user = await this.userService.findByEmail(email);
    if (!user) throw new Error(`No user with email ${email} is registered`);

    const [accessToken, refreshToken] = await Promise.all([
      this.authService.signAccessJwt(user),
      this.authService.signRefreshJwt(user),
    ]);
    this.setRefreshTokenCookie(res, refreshToken.token);
    await this.redisService.registerToken(
      refreshToken.payload.id,
      refreshToken.payload.tid,
    );

    const resData = { access_token: accessToken.token };
    const resJson = JSON.stringify(resData);

    res.send(`
    <html>
      <body>
        <script>
          // send JWT back to the opener (the tab that called window.open)
          window.opener.postMessage(
            ${resJson},
            "${this.appOrigin}"
          );
          window.close();
        </script>
      </body>
    </html>
  `);
  }
}
