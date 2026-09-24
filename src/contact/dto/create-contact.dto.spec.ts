import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateContactDto } from './create-contact.dto.js';

describe('CreateContactDto', () => {
  const validPayload = {
    siteId: 'deliva',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phoneNumber: '+254 700 000 000',
    message: 'Please tell me more about your services.',
  };

  it('accepts the minimum valid contact payload', async () => {
    const dto = plainToInstance(CreateContactDto, validPayload);

    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts optional company and subject fields', async () => {
    const dto = plainToInstance(CreateContactDto, {
      ...validPayload,
      company: 'Acme Ltd',
      subject: 'Partnership enquiry',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it.each([
    ['email', { email: 'not-an-email' }],
    ['fullName', { fullName: 'J' }],
    ['phoneNumber', { phoneNumber: '123' }],
    ['message', { message: 'short' }],
  ])('rejects an invalid %s', async (property, override) => {
    const dto = plainToInstance(CreateContactDto, {
      ...validPayload,
      ...override,
    });
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === property)).toBe(true);
  });
});
