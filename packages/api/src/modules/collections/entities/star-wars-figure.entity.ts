import { Column, Entity } from 'typeorm';
import {
  CardbackStyle,
  CollectionType,
  FigureSize,
  StarWarsLine,
} from '@my-collections/shared';
import { BaseCollectionItemEntity } from './base-item.entity';

@Entity('star_wars_figures')
export class StarWarsFigureEntity extends BaseCollectionItemEntity {
  collectionType!: CollectionType.STAR_WARS;

  @Column({ type: 'enum', enum: StarWarsLine })
  line!: StarWarsLine;

  @Column({ type: 'enum', enum: FigureSize })
  figureSize!: FigureSize;

  @Column({ default: false })
  isVariant!: boolean;

  @Column({ type: 'text', nullable: true })
  variantDescription!: string | null;

  @Column({ type: 'enum', enum: CardbackStyle, nullable: true })
  cardbackStyle!: CardbackStyle | null;

  @Column({ default: false })
  isCarded!: boolean;

  @Column('text', { array: true, default: '{}' })
  accessories!: string[];

  @Column('text', { array: true, default: '{}' })
  ownedAccessories!: string[];

  @Column({ type: 'boolean', nullable: true })
  coinIncluded!: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  kennerItemNumber!: string | null;
}
