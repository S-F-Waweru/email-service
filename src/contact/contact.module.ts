import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ContactRequest } from './entities/contact-request.entity.js';
import { ContactController } from './contact.controller.js';
import { ContactService } from './contact.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactRequest]),
    BullModule.registerQueue({ name: 'mail' }),
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
