import {
  Column,
  CreateDateColumn,
  ManyToOne,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  AcquisitionSource,
  ConditionGrade,
  PackagingCondition,
  WishlistPriority,
} from '@my-collections/shared';
import { User } from '../../auth/entities/user.entity';
import { moneyTransformer } from './base-item.entity';
import { StarWarsCatalogEntity } from './star-wars-catalog.entity';

@Entity('user_star_wars_items')
export class UserStarWarsItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => StarWarsCatalogEntity, (catalog) => catalog.userItems, { nullable: false })
  catalog!: StarWarsCatalogEntity;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @Column({ default: false })
  isOwned!: boolean;

  @Column({ type: 'enum', enum: WishlistPriority, nullable: true })
  wishlistPriority!: WishlistPriority | null;

  @Column({ type: 'enum', enum: ConditionGrade, nullable: true })
  condition!: ConditionGrade | null;

  @Column({ type: 'enum', enum: PackagingCondition, nullable: true })
  packagingCondition!: PackagingCondition | null;

  @Column({ default: false })
  isComplete!: boolean;

  @Column('text', { array: true, default: '{}' })
  ownedAccessories!: string[];

  @Column({ default: false })
  isCarded!: boolean;

  @Column({ default: false })
  isBoxed!: boolean;

  @Column({ type: 'enum', enum: AcquisitionSource, nullable: true })
  acquisitionSource!: AcquisitionSource | null;

  @Column({ type: 'date', nullable: true })
  acquisitionDate!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: moneyTransformer })
  acquisitionPrice!: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: moneyTransformer })
  estimatedValue!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column('text', { array: true, default: '{}' })
  photoUrls!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
