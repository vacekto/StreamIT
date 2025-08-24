import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/entity.user';
import { UserService } from '../user/user.service';
import { AuthenticatedUser } from './types/auth.types.authenticated-user';
import { JwtPayload } from './types/auth.types.jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    const match = await this.comparePasswords(password, user.password);
    if (!match) return null;

    return user;
  }

  comparePasswords = (pwd_provided: string, pwd_hash: string) => {
    return bcrypt.compare(pwd_provided, pwd_hash);
  };

  signAccessJwt(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      username: user.username,
      id: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  signRefreshJwt(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      username: user.username,
      id: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
