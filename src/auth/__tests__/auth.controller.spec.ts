import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { User } from 'src/user/entities/entity.user';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('Authentication', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

  const authServiceMock = {
    provide: AuthService,
    useValue: {
      signAccessJwt: jest.fn(),
      signRefreshJwt: jest.fn(),
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
      controllers: [AuthController],
      providers: [authServiceMock, configServiceMock],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
  });

  describe('Auth controller', () => {
    it('calling login should return jwt for authenticated user', () => {
      const user: User = {
        email: 'someone@gmail.com',
        id: 'uuid',
        username: 'some_username',
        password: 'pwd123',
      };

      const res: Response = {} as Response;
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      res.send = jest.fn().mockReturnValue(res);
      res.cookie = jest.fn().mockReturnValue(res);
      res.clearCookie = jest.fn().mockReturnValue(res);

      const token = 'valid_jwt';

      authService.signAccessJwt.mockResolvedValue(token);
      const result = controller.login(user, res);
      expect(result).toEqual(new Promise(() => ({})));
      expect(authService.signAccessJwt).toHaveBeenCalledWith(user);
    });
  });
});
