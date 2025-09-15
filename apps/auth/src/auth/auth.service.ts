import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { RedisService } from '../redis/redis.service';
import { User } from '../user/entities/entity.user';
import { UserService } from '../user/user.service';
import { AuthenticatedUser, JwtPayload } from './types/auth.types';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  private accessJwtLifetime: number;
  private refreshJwtLifetime: number;
  private refreshJwtSecret: string;
  private accessJwtSecret: string;
  private googleRedirectUri: string;
  private isProd: boolean;
  private host: string;
  private port: string;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private reidsService: RedisService,
  ) {
    this.accessJwtLifetime = parseInt(
      this.configService.get<string>('JWT_ACCESS_LIFETIME')!,
    );
    this.refreshJwtLifetime = parseInt(
      this.configService.get<string>('JWT_REFRESH_LIFETIME')!,
    );

    this.refreshJwtSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET')!;
    this.accessJwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    this.host = this.configService.get('HOST')!;
    this.port = this.configService.get('PORT')!;
    this.isProd = this.configService.get('NODE_ENV') === 'production';
    this.googleRedirectUri = `${this.isProd ? 'https' : 'http'}://${this.host}:${this.port}/auth/google/callback`;
  }

  async verifyGoogleIdToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new Error('No email found in Google ID token');

    return { email: payload.email };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;

    return user;
  }

  generateTokenId(length = 16) {
    return randomBytes(length).toString('hex');
  }

  async signAccessJwt(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      username: user.username,
      id: user.id,
      email: user.email,
      tid: this.generateTokenId(),
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessJwtLifetime,
      secret: this.accessJwtSecret,
    });

    return { payload, token };
  }

  async signRefreshJwt(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      username: user.username,
      id: user.id,
      email: user.email,
      tid: this.generateTokenId(),
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.refreshJwtLifetime,
      secret: this.refreshJwtSecret,
    });

    return { payload, token };
  }

  getGoogleAuthUrl(): string {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: this.googleRedirectUri,
      response_type: 'code',
      scope: ['openid', 'email'].join(' '),
      access_type: 'offline',
      prompt: 'consent',
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }
}
