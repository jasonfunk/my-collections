import {
  Column,
  CreateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';
import {
  AcquisitionSource,
  CollectionType,
  ConditionGrade,
  PackagingCondition,
} from '@my-collections/shared';
import { User } from '../../auth/entities/user.entity';

/**
 * Converts PostgreSQL numeric/decimal strings back to JS numbers.
 * The pg driver returns numeric columns as strings to preserve precision;
 * this transformer converts them transparently on read.
 */
export const moneyTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value != null ? parseFloat(value) : null),
};

/**
 * Abstract base entity with all common collection item columns.
 * Do NOT add @Entity() here — TypeORM would try to create a table for it.
 * Concrete subclasses declare @Entity('table_name') and inherit all columns.
 *
 * Analogous to a Java @MappedSuperclass.
 */
export abstract class BaseCollectionItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: CollectionType })
  collectionType!: CollectionType;

  @Column({ type: 'enum', enum: ConditionGrade })
  condition!: ConditionGrade;

  @Column({ type: 'enum', enum: PackagingCondition })
  packagingCondition!: PackagingCondition;

  @Column({ default: true })
  isOwned!: boolean;

  @Column({ default: false })
  isComplete!: boolean;

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

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
