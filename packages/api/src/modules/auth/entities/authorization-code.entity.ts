import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OAuthClient } from './oauth-client.entity';
import { User } from './user.entity';

@Entity('authorization_codes')
export class AuthorizationCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  codeHash!: string;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => OAuthClient)
  client!: OAuthClient;

  @Column()
  redirectUri!: string;

  @Column('text', { array: true })
  scopes!: string[];

  @Column()
  codeChallenge!: string;

  @Column()
  codeChallengeMethod!: string; // 'S256'

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  usedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
