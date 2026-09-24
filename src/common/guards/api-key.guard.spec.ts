import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard.js';

describe('ApiKeyGuard', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  function context(siteId: string, apiKey?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body: { siteId },
          headers: apiKey ? { 'x-api-key': apiKey } : {},
        }),
      }),
    } as ExecutionContext;
  }

  it('allows a request with the configured site API key', () => {
    process.env.SITE_DELIVA_APIKEY = 'secret-key';
    process.env.SITE_DELIVA_RECIPIENT = 'inbox@example.com';

    expect(new ApiKeyGuard().canActivate(context('deliva', 'secret-key'))).toBe(
      true,
    );
  });

  it.each([
    ['an unknown site', 'unknown', 'secret-key'],
    ['a missing key', 'deliva', undefined],
    ['an incorrect key', 'deliva', 'wrong-key'],
  ])('rejects %s', (_case, siteId, apiKey) => {
    process.env.SITE_DELIVA_APIKEY = 'secret-key';
    process.env.SITE_DELIVA_RECIPIENT = 'inbox@example.com';

    expect(() =>
      new ApiKeyGuard().canActivate(context(siteId, apiKey)),
    ).toThrow(UnauthorizedException);
  });
});
