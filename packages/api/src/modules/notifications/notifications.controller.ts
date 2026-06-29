import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';
import { NotificationsService, PushSendResult } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Internal] Send a push notification to a user\'s devices' })
  @ApiResponse({ status: 200, description: 'Push result with sent/failed counts' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token' })
  async sendPush(@Body() dto: SendPushNotificationDto): Promise<PushSendResult> {
    return this.notificationsService.sendPush(dto);
  }
}
