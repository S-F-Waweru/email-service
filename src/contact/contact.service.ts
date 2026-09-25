import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ContactRequest } from './entities/contact-request.entity.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { getSiteConfig } from '../config/sites.config.js';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactRequest)
    private readonly repo: Repository<ContactRequest>,
    @InjectQueue('mail') private readonly mailQueue: Queue,
  ) {}

  async handleContact(dto: CreateContactDto, idempotencyKey: string) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const existing = await this.repo.findOne({ where: { idempotencyKey } });
    if (existing) {
      this.logger.log(
        `Contact request duplicate requestId=${existing.id} status=${existing.status}`,
      );
      return {
        success: true,
        message:
          'Your message was already received. No duplicate submission was created.',
        requestId: existing.id,
        status: 'accepted' as const,
        duplicate: true,
      };
    }

    const site = getSiteConfig(dto.siteId);
    if (!site) {
      throw new BadRequestException('Unknown or unconfigured site');
    }

    const record = this.repo.create({
      idempotencyKey,
      siteId: dto.siteId,
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      company: dto.company,
      subject: dto.subject,
      message: dto.message,
      status: 'queued',
    });
    await this.repo.save(record);
    this.logger.log(
      `Contact request accepted requestId=${record.id} siteId=${record.siteId} status=${record.status}`,
    );

    void this.enqueueContactEmail(
      record.id,
      record.createdAt ?? new Date(),
      dto,
      site.name,
      site.recipient,
    ).catch(async (error: unknown) => {
      const stack = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Unable to queue contact email ${record.id}; marking it failed`,
        stack,
      );
      await this.updateStatus(record.id, 'failed');
    });

    return {
      success: true,
      message:
        'Thank you. Your message has been received and will be delivered shortly.',
      requestId: record.id,
      status: 'accepted' as const,
      duplicate: false,
    };
  }

  private async enqueueContactEmail(
    contactId: string,
    receivedAt: Date,
    dto: CreateContactDto,
    sourceName: string,
    recipient: string,
  ): Promise<void> {
    const job = await this.mailQueue.add(
      'send-contact-email',
      {
        contactId,
        receivedAt: receivedAt.toISOString(),
        sourceName,
        to: recipient,
        from: dto.email,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        company: dto.company,
        subject: `[${sourceName}] ${dto.subject || 'New contact request'}`,
        message: dto.message,
        siteId: dto.siteId,
      },
      {
        attempts: 5,
        // Initial attempt plus retries after 2, 4, 8, and 16 seconds.
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log(
      `Contact email queued requestId=${contactId} jobId=${String(job.id)} siteId=${dto.siteId} attempts=5`,
    );
  }

  updateStatus(id: string, status: ContactRequest['status']) {
    return this.repo.update(id, { status });
  }
}
