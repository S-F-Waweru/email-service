import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ContactRequest } from './entities/contact-request.entity.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { getSiteConfig } from '../config/sites.config.js';

@Injectable()
export class ContactService {
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
      return { id: existing.id, status: existing.status, duplicate: true };
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

    await this.mailQueue.add(
      'send-contact-email',
      {
        contactId: record.id,
        to: site.recipient,
        from: dto.email,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        company: dto.company,
        subject: dto.subject || `New contact form: ${dto.siteId}`,
        message: dto.message,
        siteId: dto.siteId,
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return { id: record.id, status: record.status, duplicate: false };
  }

  updateStatus(id: string, status: ContactRequest['status']) {
    return this.repo.update(id, { status });
  }
}
