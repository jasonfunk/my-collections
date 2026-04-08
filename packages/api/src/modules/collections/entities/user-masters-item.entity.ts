import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { MastersCatalogEntity } from './masters-catalog.entity';

// TODO: expand with full field set when Masters scraper lands (COL-xx)
@Entity('user_masters_items')
export class UserMastersItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => MastersCatalogEntity, (catalog) => catalog.userItems, { nullable: false })
  catalog!: MastersCatalogEntity;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @Column({ default: false })
  isOwned!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
