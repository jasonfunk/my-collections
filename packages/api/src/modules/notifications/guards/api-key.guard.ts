import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const apiKey = this.config.get<string>('NOTIFICATIONS_API_KEY');
    const provided = req.headers['x-api-key'];

    if (!apiKey || provided !== apiKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    return true;
  }
}
