import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';

export interface PushResult {
  queued: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly usersService: UsersService) {}

  async sendPush(dto: SendPushNotificationDto): Promise<PushResult> {
    const tokens = await this.usersService.findDeviceTokensByUserId(dto.userId);

    if (tokens.length === 0) {
      this.logger.warn(`No device tokens found for user ${dto.userId}`);
      return { queued: 0 };
    }

    // Phase 2: dispatch to FCM here.
    this.logger.log(
      `[stub] Would send "${dto.title}" to ${tokens.length} device(s) for user ${dto.userId}`,
    );

    return { queued: tokens.length };
  }
}
