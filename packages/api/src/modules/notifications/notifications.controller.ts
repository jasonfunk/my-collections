import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';
import { ApiKeyGuard } from './guards/api-key.guard';
import { NotificationsService, PushResult } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiHeader({ name: 'x-api-key', description: 'Internal API key (NOTIFICATIONS_API_KEY)' })
  @ApiOperation({ summary: '[Internal] Send a push notification to a user\'s devices' })
  @ApiResponse({ status: 200, description: 'Tokens queued for delivery' })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key' })
  async sendPush(@Body() dto: SendPushNotificationDto): Promise<PushResult> {
    return this.notificationsService.sendPush(dto);
  }
}
