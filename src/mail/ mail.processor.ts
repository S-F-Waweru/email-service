import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailService } from './ mail.service.js';
import { ContactService } from '../contact/contact.service.js';


@Processor('mail')
export class MailProcessor {
  constructor(
    private readonly mailService: MailService,
    private readonly contactService: ContactService,
  ) {}

  @Process('send-contact-email')
  async handleSendEmail(job: Job) {
    const { contactId, to, from, name, subject, message } = job.data;

    const html = `
      <h3>New contact form submission</h3>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${from}</p>
      <p><b>Message:</b></p>
      <p>${message}</p>
    `;

    try {
      await this.mailService.send(to, subject, html, from);
      await this.contactService.updateStatus(contactId, 'sent');
    } catch (err) {
      await this.contactService.updateStatus(contactId, 'failed');
      throw err; // triggers Bull retry
    }
  }
}
