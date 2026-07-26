import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum DevicePlatform {
  Android = 'android',
  iOS = 'ios',
}

@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  user!: User;

  @Column()
  userId!: string;

  @Index({ unique: true })
  @Column()
  token!: string;

  @Column({ type: 'enum', enum: DevicePlatform, default: DevicePlatform.Android })
  platform!: DevicePlatform;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
