import { BadRequestException } from '@nestjs/common';
import type { Queue } from 'bull';
import type { Repository } from 'typeorm';
import { ContactService } from './contact.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import type { ContactRequest } from './entities/contact-request.entity.js';

describe('ContactService', () => {
  const originalEnvironment = { ...process.env };
  const dto: CreateContactDto = {
    siteId: 'deliva',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phoneNumber: '+254700000000',
    company: 'Acme Ltd',
    subject: 'Partnership',
    message: 'I would like to discuss a partnership.',
  };

  let repo: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let queue: { add: ReturnType<typeof vi.fn> };
  let service: ContactService;

  beforeEach(() => {
    process.env.SITE_DELIVA_APIKEY = 'secret-key';
    process.env.SITE_DELIVA_RECIPIENT = 'contact@deliva.example';
    repo = {
      findOne: vi.fn(),
      create: vi.fn((record) => ({ id: 'contact-1', ...record })),
      save: vi.fn(),
      update: vi.fn(),
    };
    queue = { add: vi.fn() };
    service = new ContactService(
      repo as unknown as Repository<ContactRequest>,
      queue as unknown as Queue,
    );
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('requires an idempotency key', async () => {
    await expect(service.handleContact(dto, '')).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('returns the existing request without enqueueing a duplicate', async () => {
    repo.findOne.mockResolvedValue({ id: 'existing-1', status: 'sent' });

    await expect(service.handleContact(dto, 'same-key')).resolves.toEqual({
      id: 'existing-1',
      status: 'sent',
      duplicate: true,
    });
    expect(repo.save).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('persists and queues a valid contact request', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.handleContact(dto, 'unique-key')).resolves.toEqual({
      id: 'contact-1',
      status: 'queued',
      duplicate: false,
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'unique-key',
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        status: 'queued',
      }),
    );
    expect(repo.save).toHaveBeenCalledOnce();
    expect(queue.add).toHaveBeenCalledWith(
      'send-contact-email',
      expect.objectContaining({
        contactId: 'contact-1',
        to: 'contact@deliva.example',
        siteId: 'deliva',
      }),
      expect.objectContaining({ attempts: 5, removeOnComplete: true }),
    );
  });

  it('rejects a site that is not configured', async () => {
    repo.findOne.mockResolvedValue(null);
    const unknownSiteDto = Object.assign(new CreateContactDto(), dto, {
      siteId: 'unknown',
    });

    await expect(
      service.handleContact(unknownSiteDto, 'unique-key'),
    ).rejects.toThrow('Unknown or unconfigured site');
    expect(repo.save).not.toHaveBeenCalled();
  });
});
