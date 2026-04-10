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
import { G1TransformersCatalogEntity } from './g1-transformers-catalog.entity';

@Entity('user_g1_transformers_items')
export class UserG1TransformersItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => G1TransformersCatalogEntity, (catalog) => catalog.userItems, { nullable: false })
  catalog!: G1TransformersCatalogEntity;

  @RelationId((item: UserG1TransformersItemEntity) => item.catalog)
  catalogId!: string;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @RelationId((item: UserG1TransformersItemEntity) => item.user)
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
  isBoxed!: boolean;

  @Column({ default: false })
  hasInstructions!: boolean;

  @Column({ default: false })
  hasTechSpec!: boolean;

  @Column({ type: 'boolean', nullable: true })
  rubSign!: boolean | null;

  @Column({ type: 'enum', enum: AcquisitionSource, nullable: true })
  acquisitionSource!: AcquisitionSource | null;

  @Column({ type: 'date', nullable: true })
  acquisitionDate!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  acquisitionPrice!: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
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
