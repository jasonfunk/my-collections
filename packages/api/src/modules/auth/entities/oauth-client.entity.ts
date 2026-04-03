import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('oauth_clients')
export class OAuthClient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  clientId!: string;

  @Column({ nullable: true, type: 'varchar' })
  clientSecretHash!: string | null; // null = public client (web SPA, mobile app)

  @Column()
  name!: string;

  @Column('text', { array: true })
  redirectUris!: string[];

  @Column('text', { array: true })
  allowedScopes!: string[];
}
