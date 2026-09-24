import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { getSiteConfig } from '../../config/sites.config.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const siteId = req.body?.siteId;
    const apiKey = req.headers['x-api-key'];

    const site = getSiteConfig(siteId);
    if (!site || !apiKey || apiKey !== site.apiKey) {
      throw new UnauthorizedException('Invalid API key or site');
    }
    return true;
  }
}
