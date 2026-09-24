import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailService } from './mail.service.js';
import { ContactService } from '../contact/contact.service.js';

interface ContactEmailJob {
  contactId: string;
  to: string;
  from: string;
  fullName: string;
  phoneNumber: string;
  company?: string;
  subject: string;
  message: string;
  siteId: string;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[
        character
      ]!,
  );
}

@Processor('mail')
export class MailProcessor {
  constructor(
    private readonly mailService: MailService,
    private readonly contactService: ContactService,
  ) {}

  @Process('send-contact-email')
  async handleSendEmail(job: Job<ContactEmailJob>): Promise<void> {
    const {
      contactId,
      to,
      from,
      fullName,
      phoneNumber,
      company,
      subject,
      message,
      siteId,
    } = job.data;
    const safe = {
      fullName: escapeHtml(fullName),
      from: escapeHtml(from),
      phoneNumber: escapeHtml(phoneNumber),
      company: company ? escapeHtml(company) : undefined,
      message: escapeHtml(message).replace(/\r?\n/g, '<br>'),
      siteId: escapeHtml(siteId),
    };
    const companyRow = safe.company
      ? `<tr><td style="padding:8px 0;color:#64748b">Company</td><td style="padding:8px 0">${safe.company}</td></tr>`
      : '';
    const html = `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="padding:24px;background:#111827;color:#fff">
      <h1 style="margin:0;font-size:22px">New contact request</h1>
      <p style="margin:8px 0 0;color:#cbd5e1">Submitted through ${safe.siteId}</p>
    </div>
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#64748b;width:130px">Full name</td><td style="padding:8px 0">${safe.fullName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0"><a href="mailto:${safe.from}">${safe.from}</a></td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Phone</td><td style="padding:8px 0">${safe.phoneNumber}</td></tr>
        ${companyRow}
      </table>
      <div style="margin-top:20px;padding:18px;background:#f8fafc;border-left:4px solid #6366f1;border-radius:4px;line-height:1.6">${safe.message}</div>
    </div>
  </div>
</body></html>`;
    const text = [
      `New contact request from ${siteId}`,
      `Full name: ${fullName}`,
      `Email: ${from}`,
      `Phone: ${phoneNumber}`,
      ...(company ? [`Company: ${company}`] : []),
      '',
      message,
    ].join('\n');

    try {
      await this.mailService.send(to, subject, html, text, from);
      await this.contactService.updateStatus(contactId, 'sent');
    } catch (error) {
      await this.contactService.updateStatus(contactId, 'failed');
      throw error;
    }
  }
}
