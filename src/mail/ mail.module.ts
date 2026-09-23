import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ContactModule } from '../contact/contact.module.js';
import { MailProcessor } from './ mail.processor.js';
import { MailService } from './ mail.service.js';



@Module({
  imports: [BullModule.registerQueue({ name: 'mail' }), ContactModule],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
