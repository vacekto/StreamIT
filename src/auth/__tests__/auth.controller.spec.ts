import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { User } from 'src/user/entities/entity.user';

describe('Authentication', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const serviceMock = {
    provide: AuthService,
    useValue: {
      signJwtToken: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [serviceMock],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  describe('Auth controller', () => {
    it('calling login should return jwt for authenticated user', () => {
      const user: User = {
        email: 'someone@gmail.com',
        id: 'uuid',
        username: 'some_username',
        password: 'pwd123',
      };

      const token = {
        access_token: 'valid_jwt',
      };

      service.signJwtToken.mockReturnValue(token);

      const result = controller.login(user);
      expect(result).toEqual(token);
      expect(service.signJwtToken).toHaveBeenCalledWith(user);
    });
  });
});
