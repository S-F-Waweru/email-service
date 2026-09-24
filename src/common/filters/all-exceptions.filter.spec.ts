import {
  BadRequestException,
  Logger,
  type ArgumentsHost,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

describe('AllExceptionsFilter', () => {
  function createHost() {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const request = {
      method: 'POST',
      originalUrl: '/contact',
      headers: { 'x-request-id': 'request-123' },
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ status }),
      }),
    } as ArgumentsHost;

    return { host, status, json };
  }

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('formats validation errors consistently', () => {
    const { host, status, json } = createHost();
    const exception = new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: ['email must be an email', 'message is too short'],
    });

    new AllExceptionsFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/contact',
        method: 'POST',
        error: 'Bad Request',
        message: ['email must be an email', 'message is too short'],
        requestId: 'request-123',
        timestamp: expect.any(String),
      }),
    );
  });

  it('hides internal error details and logs the stack', () => {
    const { host, status, json } = createHost();
    const errorSpy = vi.spyOn(Logger.prototype, 'error');

    new AllExceptionsFilter().catch(
      new Error('database password leaked'),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(
      'database password leaked',
    );
    expect(errorSpy).toHaveBeenCalled();
  });
});
