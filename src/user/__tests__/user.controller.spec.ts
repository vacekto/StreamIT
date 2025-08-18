import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { User } from '../entities/entity.user';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('User controller', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  const serviceMock = {
    provide: UserService,
    useValue: {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [serviceMock],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);
  });

  describe('create', () => {
    it('should return the created user', async () => {
      const dto: CreateUserDto = {
        username: 'john',
        email: 'john@test.com',
        password: 'pwd',
      };
      const mockUser = { id: '1', ...dto };
      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(dto);
      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto: CreateUserDto = {
        username: 'john',
        email: 'dup@test.com',
        password: 'pwd',
      };
      service.create.mockResolvedValue(null);

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should call service.update and return updated user', async () => {
      const dto: UpdateUserDto = { username: 'newname' };
      const mockUser = { id: '1', ...dto };
      service.update.mockResolvedValue(mockUser as User);

      const result = await controller.update('1', dto);
      expect(result).toEqual(mockUser);
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should return 204 if user is removed', async () => {
      service.remove.mockResolvedValue(true);

      await expect(controller.remove('1')).resolves.toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      service.remove.mockResolvedValue(false);

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
