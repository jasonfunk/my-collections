import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User UUID' })
  id!: string;

  @ApiProperty({ description: 'User email address' })
  email!: string;

  @ApiProperty({ description: 'Whether the user account is approved' })
  isApproved!: boolean;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt!: Date;
}
