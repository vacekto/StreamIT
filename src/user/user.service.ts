import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PostgresErrorCode } from '../util/erro-codes';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/entity.user';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User | null> {
    try {
      const hashedPassword = await this.hashPassword(createUserDto.password);
      createUserDto.password = hashedPassword;
      const newUser = this.userRepository.create(createUserDto);
      await this.userRepository.save(newUser);
      return newUser;
    } catch (error) {
      const err = error as { code?: string };
      if (err?.code === PostgresErrorCode.UNIQUE_VIOLATION) return null;
      throw error;
    }
  }

  findAll() {
    return this.userRepository.find();
  }

  async findById(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);

    try {
      await this.userRepository.save(user);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === PostgresErrorCode.UNIQUE_VIOLATION)
        throw new ConflictException('Email already exists');
      throw error;
    }

    return user;
  }

  async hashPassword(pwd: string) {
    return bcrypt.hash(pwd, 10);
  }

  async remove(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return false;
    void this.userRepository.remove(user);
    return true;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({
      email,
    });
  }
}
