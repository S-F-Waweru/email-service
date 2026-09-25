import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import type { ContactService } from '../contact/contact.service.js';
import { MailProcessor } from './mail.processor.js';
import type { MailService } from './mail.service.js';

describe('MailProcessor', () => {
  const job = {
    id: 'job-1',
    attemptsMade: 0,
    opts: { attempts: 5 },
    data: {
      contactId: 'contact-1',
      receivedAt: '2026-09-24T10:30:00.000Z',
      sourceName: 'Deliva Fasta',
      to: 'recipient@example.com',
      from: 'sender@example.com',
      fullName: '<script>Jane</script>',
      phoneNumber: '+254700000000',
      company: 'Acme & Sons',
      subject: 'Website enquiry',
      message: 'Hello <b>team</b>\nSecond line',
      siteId: 'deliva',
    },
  } as Job;

  let mailService: { send: ReturnType<typeof vi.fn> };
  let contactService: { updateStatus: ReturnType<typeof vi.fn> };
  let processor: MailProcessor;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    mailService = { send: vi.fn().mockResolvedValue(undefined) };
    contactService = { updateStatus: vi.fn().mockResolvedValue(undefined) };
    processor = new MailProcessor(
      mailService as unknown as MailService,
      contactService as unknown as ContactService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends safe HTML, includes plain text, and marks the request as sent', async () => {
    await processor.handleSendEmail(job);

    expect(mailService.send).toHaveBeenCalledOnce();
    const [, , html, text, replyTo] = mailService.send.mock.calls[0];
    expect(html).toContain('&lt;script&gt;Jane&lt;/script&gt;');
    expect(html).not.toContain('contact-1');
    expect(html).toContain('Deliva Fasta');
    expect(html).toContain('24 Sept 2026, 10:30 UTC');
    expect(html).toContain('Website enquiry');
    expect(html).toContain('Acme &amp; Sons');
    expect(html).toContain('Hello &lt;b&gt;team&lt;/b&gt;<br>Second line');
    expect(html).not.toContain('<script>');
    expect(text).toContain('Full name: <script>Jane</script>');
    expect(text).toContain('Company site: Deliva Fasta');
    expect(text).not.toContain('Reference: contact-1');
    expect(replyTo).toBe('sender@example.com');
    expect(contactService.updateStatus).toHaveBeenCalledWith(
      'contact-1',
      'sent',
    );
  });

  it('marks the request failed and rethrows when SMTP delivery fails', async () => {
    const deliveryError = new Error('SMTP unavailable');
    mailService.send.mockRejectedValue(deliveryError);

    await expect(processor.handleSendEmail(job)).rejects.toBe(deliveryError);
    expect(contactService.updateStatus).toHaveBeenCalledWith(
      'contact-1',
      'failed',
    );
  });
});
