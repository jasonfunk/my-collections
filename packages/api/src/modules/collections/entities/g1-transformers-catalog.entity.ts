import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransformersFaction, TransformersLine, TransformerSize } from '@my-collections/shared';
import { UserG1TransformersItemEntity } from './user-g1-transformers-item.entity';

@Entity('g1_transformers_catalog')
export class G1TransformersCatalogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: TransformersFaction, nullable: true })
  faction!: TransformersFaction | null;

  @Column({ type: 'enum', enum: TransformersLine, nullable: true })
  line!: TransformersLine | null;

  @Column({ type: 'int', nullable: true })
  releaseYear!: number | null;

  @Column({ type: 'enum', enum: TransformerSize, nullable: true })
  size!: TransformerSize | null;

  @Column({ type: 'varchar', nullable: true })
  altMode!: string | null;

  @Column('text', { array: true, default: '{}' })
  accessories!: string[];

  @Column({ type: 'varchar', nullable: true })
  catalogImageUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  sourceUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalId!: string | null;

  @Column({ default: false })
  isVariant!: boolean;

  @Column({ type: 'text', nullable: true })
  variantDescription!: string | null;

  @Column({ default: false })
  isCombiner!: boolean;

  @Column({ type: 'varchar', nullable: true })
  combinerTeam!: string | null;

  @Column({ default: false })
  isGiftSet!: boolean;

  @Column({ default: false })
  isMailaway!: boolean;

  @Column({ default: false })
  japaneseRelease!: boolean;

  @Column('text', { array: true, default: '{}' })
  features!: string[];

  @OneToMany(() => UserG1TransformersItemEntity, (item) => item.catalog)
  userItems!: UserG1TransformersItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
