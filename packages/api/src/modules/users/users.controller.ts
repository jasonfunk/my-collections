import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../auth/services/token.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
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
  @ApiResponse({ status: 200, description: 'Current user profile', type: UserProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  async getMe(@CurrentUser() tokenPayload: AccessTokenPayload): Promise<UserProfileResponseDto> {
    const user = await this.usersService.findById(tokenPayload.sub);
    return { id: user.id, email: user.email, isApproved: user.isApproved, createdAt: user.createdAt };
  }

  @Post('me/push-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register or refresh a push notification token for this device' })
  @ApiResponse({ status: 204, description: 'Token registered' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  async registerPushToken(
    @CurrentUser() tokenPayload: AccessTokenPayload,
    @Body() dto: RegisterPushTokenDto,
  ): Promise<void> {
    await this.usersService.upsertDeviceToken(tokenPayload.sub, dto.token, dto.platform);
  }
}
