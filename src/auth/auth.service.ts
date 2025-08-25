import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { User } from '../user/entities/entity.user';
import { UserService } from '../user/user.service';
import { AuthenticatedUser, JwtPayload } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private reidsService: RedisService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    const match = await this.comparePasswords(password, user.password);
    if (!match) return null;

    return user;
  }

  generateTokenId(length = 16) {
    return randomBytes(length).toString('hex');
  }

  comparePasswords = (pwd_provided: string, pwd_hash: string) => {
    return bcrypt.compare(pwd_provided, pwd_hash);
  };

  async signAccessJwt(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      username: user.username,
      id: user.id,
      email: user.email,
      tid: this.generateTokenId(),
    };

    const refreshExp = parseInt(
      this.configService.get<string>('JWT_ACCESS_LIFETIME')!,
    );

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: refreshExp,
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
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

    const refreshExp = parseInt(
      this.configService.get<string>('JWT_REFRESH_LIFETIME')!,
    );

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: refreshExp,
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    return { payload, token };
  }
}
