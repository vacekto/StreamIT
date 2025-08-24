import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/user/entities/entity.user';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';

describe('Authentication', () => {
  let authService: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userService: jest.Mocked<UserService>;
  let configService: jest.Mocked<ConfigService>;

  const userServiceMock = {
    provide: UserService,
    useValue: {
      findByEmail: jest.fn(),
    },
  };

  const jwtServiceMock = {
    provide: JwtService,
    useValue: {
      signAsync: jest.fn(),
    },
  };
  const configServiceMock = {
    provide: ConfigService,
    useValue: {
      get: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        jwtServiceMock,
        userServiceMock,
        AuthService,
        configServiceMock,
      ],
    }).compile();

    jwtService = module.get(JwtService);
    userService = module.get(UserService);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
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
