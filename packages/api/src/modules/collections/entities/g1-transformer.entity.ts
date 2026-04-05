import { Column, Entity } from 'typeorm';
import {
  CollectionType,
  TransformerSize,
  TransformersFaction,
  TransformersLine,
} from '@my-collections/shared';
import { BaseCollectionItemEntity } from './base-item.entity';

@Entity('g1_transformers')
export class G1TransformerEntity extends BaseCollectionItemEntity {
  collectionType!: CollectionType.TRANSFORMERS;

  @Column({ type: 'enum', enum: TransformersFaction })
  faction!: TransformersFaction;

  @Column({ type: 'enum', enum: TransformersLine })
  line!: TransformersLine;

  @Column({ type: 'enum', enum: TransformerSize })
  size!: TransformerSize;

  @Column()
  altMode!: string;

  @Column('text', { array: true, default: '{}' })
  accessories!: string[];

  @Column('text', { array: true, default: '{}' })
  ownedAccessories!: string[];

  @Column({ default: false })
  isBoxed!: boolean;

  @Column({ default: false })
  hasInstructions!: boolean;

  @Column({ default: false })
  hasTechSpec!: boolean;

  @Column({ default: false })
  isCombiner!: boolean;

  @Column({ type: 'varchar', nullable: true })
  combinerTeam!: string | null;

  @Column({ type: 'boolean', nullable: true })
  isGiftSet!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  isMailaway!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  japaneseRelease!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  rubSign!: boolean | null;
}
