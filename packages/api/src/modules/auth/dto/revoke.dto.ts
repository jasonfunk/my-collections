import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RevokeDto {
  @ApiProperty({
    description: 'Refresh token to revoke. Optional when the token is supplied via the httpOnly cookie (web clients).',
    required: false,
  })
  @IsOptional()
  @IsString()
  token?: string;
}
