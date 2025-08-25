import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/entity.user';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('PG_HOST'),
        port: config.get<number>('PG_PORT'),
        username: config.get('PG_USER'),
        password: config.get('PG_PWD'),
        database: config.get('PG_DB'),
        entities: [User],
        synchronize: config.get('NODE_ENV') !== 'production',
        dropSchema: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export default class DatabaseModule {}
