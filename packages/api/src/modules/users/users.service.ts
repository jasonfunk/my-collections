import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { DevicePlatform, DeviceToken } from './entities/device-token.entity';

/**
 * Manages user profile data.
 * Authentication and token concerns live in AuthService/TokenService.
 * This service owns: "who am I, what are my details, update my profile".
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async upsertDeviceToken(userId: string, token: string, platform: DevicePlatform): Promise<void> {
    await this.deviceTokenRepo.upsert({ userId, token, platform }, ['token']);
  }

  async findDeviceTokensByUserId(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepo.find({ where: { userId } });
  }
}
