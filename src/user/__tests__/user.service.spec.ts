import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { UserService } from '../user.service';
import { User } from '../entities/entity.user';
import { PostgresErrorCode } from '../../util/erro-codes';
import { ConflictException, NotFoundException } from '@nestjs/common';

type MockRepo<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('User service', () => {
  let service: UserService;
  let repo: MockRepo<User>;

  const mockRepo: MockRepo<User> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should hash password and save new user', async () => {
      const password = 'password';
      const dto = { username: 'john', email: 'john@mail.com', password };
      const hash = 'some_hash';

      jest.spyOn(service, 'hashPassword').mockResolvedValue(hash);
      const createdUser = { ...dto, id: 'uuid', password: hash } as User;
      repo.create!.mockReturnValue(createdUser);
      repo.save!.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(service.hashPassword).toHaveBeenCalledWith(password);
      expect(repo.create).toHaveBeenCalledWith({ ...dto, password: hash });
      expect(repo.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });

    it('should return null after saving duplicate email value', async () => {
      const dto = {
        username: 'john',
        email: 'john@mail.com',
        password: 'password',
      };
      const dbErrorMock = { code: PostgresErrorCode.UNIQUE_VIOLATION };
      repo.save!.mockRejectedValue(dbErrorMock);
      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const id = 'user-uuid';
    const hashMock = 'hashedPassword';
    const updateUserDto = {
      username: 'newname',
      password: '1234',
      email: 'new@mail.com',
    };
    const existingUser = {
      id,
      username: 'oldname',
      password: 'oldhash',
      email: 'old@mail.com',
    } as User;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update user successfully', async () => {
      jest.spyOn(service, 'hashPassword').mockResolvedValue(hashMock);
      repo.findOneBy!.mockResolvedValue(existingUser);
      repo.save!.mockResolvedValue({
        ...existingUser,
        ...updateUserDto,
        password: hashMock,
      });

      const result = await service.update(id, updateUserDto);

      expect(result).toEqual({
        ...existingUser,
        ...updateUserDto,
        password: hashMock,
      });
      expect(service.hashPassword).toHaveBeenCalledWith('1234');
      expect(repo.save).toHaveBeenCalledWith({
        ...existingUser,
        ...updateUserDto,
        password: hashMock,
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException on unique DB constrain violation ', async () => {
      jest.spyOn(service, 'hashPassword').mockResolvedValue(hashMock);
      repo.findOneBy!.mockResolvedValue(existingUser);
      const dbError = { code: PostgresErrorCode.UNIQUE_VIOLATION } as {
        code: string;
      };
      repo.save!.mockRejectedValue(dbError);

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
