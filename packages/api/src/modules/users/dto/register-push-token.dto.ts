import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { DevicePlatform } from '../entities/device-token.entity';

export class RegisterPushTokenDto {
  @ApiProperty({ description: 'FCM registration token for this device' })
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty({ enum: DevicePlatform, default: DevicePlatform.Android })
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;
}
