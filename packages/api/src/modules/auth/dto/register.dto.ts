import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'collector@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Password (minimum 8 characters)', example: 'hunter2hunter2' })
  @IsString()
  @MinLength(8)
  password!: string;
}
