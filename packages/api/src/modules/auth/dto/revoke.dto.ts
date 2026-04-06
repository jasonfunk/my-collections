import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RevokeDto {
  @ApiProperty({ description: 'Refresh token to revoke' })
  @IsString()
  token!: string;
}
