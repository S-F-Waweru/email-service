import type { Job } from 'bull';
import type { ContactService } from '../contact/contact.service.js';
import { MailProcessor } from './mail.processor.js';
import type { MailService } from './mail.service.js';

describe('MailProcessor', () => {
  const job = {
    data: {
      contactId: 'contact-1',
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
    mailService = { send: vi.fn().mockResolvedValue(undefined) };
    contactService = { updateStatus: vi.fn().mockResolvedValue(undefined) };
    processor = new MailProcessor(
      mailService as unknown as MailService,
      contactService as unknown as ContactService,
    );
  });

  it('sends safe HTML, includes plain text, and marks the request as sent', async () => {
    await processor.handleSendEmail(job);

    expect(mailService.send).toHaveBeenCalledOnce();
    const [, , html, text, replyTo] = mailService.send.mock.calls[0];
    expect(html).toContain('&lt;script&gt;Jane&lt;/script&gt;');
    expect(html).toContain('Acme &amp; Sons');
    expect(html).toContain('Hello &lt;b&gt;team&lt;/b&gt;<br>Second line');
    expect(html).not.toContain('<script>');
    expect(text).toContain('Full name: <script>Jane</script>');
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
