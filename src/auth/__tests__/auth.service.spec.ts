import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { User } from 'src/user/entities/entity.user';
import { JwtPayload } from '../types/auth.types.jwt-payload';
import { UserService } from '../../user/user.service';
import { Test, TestingModule } from '@nestjs/testing';

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
    it('signs and returns jwt with correct user payload', () => {
      const userMock: User = {
        email: 'someone@gmail.com',
        id: 'uuid',
        username: 'some_username',
        password: 'pwd123',
      };

      const payloadMock: JwtPayload = {
        email: userMock.email,
        id: userMock.id,
        username: userMock.username,
      };
      const validTokenMock = 'valid_jwt';

      const resultMock = {
        access_token: validTokenMock,
      };

      jwtService.sign.mockReturnValue(validTokenMock);

      const result = authService.signJwtToken(userMock);
      expect(result).toEqual(resultMock);
      expect(jwtService.sign).toHaveBeenCalledWith(payloadMock);
    });
  });

  it('validates correct password and returns found user', async () => {
    const providedEmailMock = 'someone@gmail.com';
    const providedPwdMock = 'password';
    const foundUserMock: User = {
      email: providedEmailMock,
      id: 'uuid',
      username: 'some_username',
      password: '$2b$10$l8PitbvGifT2sizbFKDstuNoZR63aOAPfZssYHtC7qBNHTaQy68b2',
    };

    userService.findByEmail.mockResolvedValue(foundUserMock);

    const result = await authService.validateUser(
      providedEmailMock,
      providedPwdMock,
    );
    expect(result).toEqual(foundUserMock);
  });

  it('rejects incorrect password', async () => {
    const providedEmailMock = 'someone@gmail.com';
    const providedPwdMock = 'incorrect_password';
    const foundUserMock: User = {
      email: providedEmailMock,
      id: 'uuid',
      username: 'some_username',
      password: 'some_pwd',
    };

    userService.findByEmail.mockResolvedValue(foundUserMock);

    const result = await authService.validateUser(
      providedEmailMock,
      providedPwdMock,
    );
    expect(result).toBeNull();
  });
});
