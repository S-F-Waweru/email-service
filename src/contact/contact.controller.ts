import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  async create(
    @Body() dto: CreateContactDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.contactService.handleContact(dto, idempotencyKey);
  }
}
