import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ContactRequest } from './contact/entities/contact-request.entity.js';
import { MailModule } from './mail/ mail.module.js';
import { ContactModule } from './contact/contact.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [ContactRequest],
      synchronize: true, // dev only — use migrations in production
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: +process.env.DB_PORT!,
      },
    }),
    ContactModule,
    MailModule,
  ],
})
export class AppModule {}
