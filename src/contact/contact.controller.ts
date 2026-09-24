import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  @ApiOperation({ summary: 'Submit a website contact form' })
  @ApiSecurity('site-api-key')
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiHeader({ name: 'idempotency-key', required: true })
  @ApiCreatedResponse({ description: 'Contact request queued for delivery' })
  @ApiBadRequestResponse({
    description: 'Invalid request or missing idempotency key',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid API key or site' })
  async create(
    @Body() dto: CreateContactDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.contactService.handleContact(dto, idempotencyKey);
  }
}
