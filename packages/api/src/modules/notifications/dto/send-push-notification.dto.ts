import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class SendPushNotificationDto {
  @ApiProperty({ description: 'Target user UUID' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ description: 'Notification body text' })
  @IsString()
  @MinLength(1)
  body!: string;

  @ApiPropertyOptional({ description: 'Arbitrary key/value data payload' })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}
