import { Controller, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/auth.guard.local-guard';
import { AuthService } from './auth.service';
import { ReqUser } from './decorators/auth.decorator.user';
import { User } from '../user/entities/entity.user';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@ReqUser() user: User) {
    return this.authService.signJwtToken(user);
  }
}
