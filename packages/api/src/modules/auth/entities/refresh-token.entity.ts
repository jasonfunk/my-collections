import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OAuthClient } from './oauth-client.entity';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  tokenHash!: string;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => OAuthClient, { onDelete: 'CASCADE' })
  client!: OAuthClient;

  @Column('text', { array: true })
  scopes!: string[];

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  revokedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
