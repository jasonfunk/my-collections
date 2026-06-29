import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenPayload } from '../auth/services/token.service';
import { NotificationsService, PushSendResult } from '../notifications/notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

  @Post('me/push-token/test')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test push notification to all of the calling user\'s devices' })
  @ApiResponse({ status: 200, description: 'Push result with sent/failed counts' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  async testPushToken(
    @CurrentUser() tokenPayload: AccessTokenPayload,
  ): Promise<PushSendResult> {
    return this.notificationsService.sendToUser(
      tokenPayload.sub,
      'Test notification',
      'My Collections push notifications are working.',
    );
  }
}
