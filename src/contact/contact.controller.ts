import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import {
  ApiBadRequestResponse,
  ApiAcceptedResponse,
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
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submit a website contact form' })
  @ApiSecurity('site-api-key')
  @ApiHeader({ name: 'x-api-key', required: true })
  @ApiHeader({ name: 'idempotency-key', required: true })
  @ApiAcceptedResponse({
    description:
      'Contact request saved; email queueing and delivery continue asynchronously',
    schema: {
      example: {
        success: true,
        message:
          'Thank you. Your message has been received and will be delivered shortly.',
        requestId: 'b9d7895d-1b62-4dd5-a94f-490f4214f48d',
        status: 'accepted',
        duplicate: false,
      },
    },
  })
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
