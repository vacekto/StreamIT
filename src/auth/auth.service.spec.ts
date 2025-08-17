import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from 'src/user/entities/entity.user';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { JwtPayload } from './types/auth.types.jwt-payload';
import * as bcrypt from 'bcrypt';

describe('Authentication', () => {
  let authService: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userService: jest.Mocked<UserService>;

  const userServiceMock = {
    provide: UserService,
    useValue: {
      findByEmail: jest.fn(),
    },
  };

  const jwtServiceMock = {
    provide: JwtService,
    useValue: {
      sign: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [jwtServiceMock, userServiceMock, AuthService],
    }).compile();

    jwtService = module.get(JwtService);
    userService = module.get(UserService);
    authService = module.get(AuthService);
  });

  describe('Auth service', () => {
    it('should call jwt service and return generated token in expected format', () => {
      const user: User = {
        email: 'someone@gmail.com',
        id: 'uuid',
        username: 'some_username',
        password: 'pwd123',
      };

      const payload: JwtPayload = {
        email: user.email,
        id: user.id,
        username: user.username,
      };

      const token = {
        access_token: 'valid_jwt',
      };

      jwtService.sign.mockReturnValue('valid_jwt');

      const result = authService.signJwtToken(user);
      expect(result).toEqual(token);
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
    });
  });

  it('validate user based on email and password successfully', () => {
    const user: User = {
      email: 'someone@gmail.com',
      id: 'uuid',
      username: 'some_username',
      password: 'pwd123',
    };

    userService.findByEmail.mockResolvedValue(user);

    jest.spyOn(bcrypt, 'compare').mockImplementation(() => {
      return Promise.resolve(true) as unknown as void;
    });

    const payload: JwtPayload = {
      email: user.email,
      id: user.id,
      username: user.username,
    };

    const token = {
      access_token: 'valid_jwt',
    };

    jwtService.sign.mockReturnValue('valid_jwt');

    const result = authService.signJwtToken(user);
    expect(result).toEqual(token);
    expect(jwtService.sign).toHaveBeenCalledWith(payload);
  });
});
