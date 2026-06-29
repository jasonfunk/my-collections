import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from '../users/entities/device-token.entity';
import { ExpoPushService } from './expo-push.service';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';

export interface PushSendResult {
  sent: number;
  failed: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
    private readonly expoPushService: ExpoPushService,
  ) {}

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<PushSendResult> {
    const tokens = await this.deviceTokenRepo.find({ where: { userId } });

    if (tokens.length === 0) {
      this.logger.warn(`sendToUser: no device tokens for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const messages = tokens.map((t) => ({ to: t.token, title, body, data }));
    const tickets = await this.expoPushService.send(messages);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const tokenSnippet = tokens[i].token.slice(-8);

      if (ticket.status === 'ok') {
        sent++;
        this.logger.log(`Push sent to ...${tokenSnippet} for user ${userId}`);
      } else {
        failed++;
        this.logger.warn(
          `Push failed for ...${tokenSnippet}: ${ticket.message ?? 'unknown error'}`,
        );
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await this.deviceTokenRepo.delete({ token: tokens[i].token });
          this.logger.log(`Removed stale token ...${tokenSnippet}`);
        }
      }
    }

    return { sent, failed };
  }

  async sendPush(dto: SendPushNotificationDto): Promise<PushSendResult> {
    return this.sendToUser(dto.userId, dto.title, dto.body, dto.data);
  }
}
