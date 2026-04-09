import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
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
import { MastersCatalogEntity } from './masters-catalog.entity';

@Entity('user_masters_items')
export class UserMastersItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => MastersCatalogEntity, (catalog) => catalog.userItems, { nullable: false })
  catalog!: MastersCatalogEntity;

  @RelationId((item: UserMastersItemEntity) => item.catalog)
  catalogId!: string;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @RelationId((item: UserMastersItemEntity) => item.user)
  userId!: string;

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
  hasBackCard!: boolean;

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
