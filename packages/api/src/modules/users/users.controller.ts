import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../auth/services/token.service';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns the profile of the currently authenticated user.
   * This is the proof the entire OAuth2 system works end-to-end:
   * a request without a valid Bearer token will be rejected by JwtAuthGuard.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  async getMe(@CurrentUser() tokenPayload: AccessTokenPayload) {
    const user = await this.usersService.findById(tokenPayload.sub);
    return {
      id: user.id,
      email: user.email,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
    };
  }
}
