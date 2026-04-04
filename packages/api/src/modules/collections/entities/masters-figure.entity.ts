import { Column, Entity } from 'typeorm';
import {
  CollectionType,
  MastersCharacterType,
  MastersLine,
} from '@my-collections/shared';
import { BaseCollectionItemEntity } from './base-item.entity';

@Entity('masters_figures')
export class MastersFigureEntity extends BaseCollectionItemEntity {
  collectionType!: CollectionType.HE_MAN;

  @Column({ type: 'enum', enum: MastersLine })
  line!: MastersLine;

  @Column({ type: 'enum', enum: MastersCharacterType })
  characterType!: MastersCharacterType;

  @Column({ type: 'int', nullable: true })
  releaseYear!: number | null;

  @Column({ default: false })
  isVariant!: boolean;

  @Column({ type: 'text', nullable: true })
  variantDescription!: string | null;

  @Column('text', { array: true, default: '{}' })
  accessories!: string[];

  @Column('text', { array: true, default: '{}' })
  ownedAccessories!: string[];

  @Column({ default: false })
  isCarded!: boolean;

  @Column({ default: false })
  hasBackCard!: boolean;

  @Column({ type: 'varchar', nullable: true })
  miniComic!: string | null;

  @Column({ default: false })
  hasArmorOrFeature!: boolean;

  @Column({ type: 'text', nullable: true })
  featureDescription!: string | null;
}
