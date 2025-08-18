import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { JwtPayload } from './types/auth.types.jwt-payload';
import { User } from '../user/entities/entity.user';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;

    const match = await this.comparePasswords(password, user.password);
    if (!match) return null;
    console.log('pwd: ', password);
    console.log('hash: ', user.password);

    return user;
  }

  comparePasswords = (pwd_provided: string, pwd_hash: string) => {
    return bcrypt.compare(pwd_provided, pwd_hash);
  };

  signJwtToken(user: User) {
    const payload: JwtPayload = {
      username: user.username,
      id: user.id,
      email: user.email,
    };

    return { access_token: this.jwtService.sign(payload) };
  }
}
