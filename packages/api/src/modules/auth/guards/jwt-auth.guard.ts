import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../services/token.service';

/**
 * Guards routes that require a valid JWT access token.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   getMe(@CurrentUser() user: User) { ... }
 *
 * Analogous to a Servlet filter in Java or middleware in ASP.NET Core.
 * NestJS calls canActivate() before the controller method; returning false
 * (or throwing) blocks the request with 401 Unauthorized.
 *
 * On success, attaches the decoded token payload to request.user so the
 * @CurrentUser() decorator can extract it in the controller.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('No authorization token provided');
    }

    // verifyAccessToken throws UnauthorizedException on failure
    const payload = this.tokenService.verifyAccessToken(token);
    // Attach payload to request — @CurrentUser() will read it from here
    (request as Request & { user: typeof payload }).user = payload;

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}
