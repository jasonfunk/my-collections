import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  CardbackStyle,
  FigureSize,
  StarWarsCategory,
  StarWarsLine,
} from '@my-collections/shared';
import { UserStarWarsItemEntity } from './user-star-wars-item.entity';

@Entity('star_wars_catalog')
export class StarWarsCatalogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: StarWarsCategory })
  category!: StarWarsCategory;

  @Column({ type: 'enum', enum: StarWarsLine, nullable: true })
  line!: StarWarsLine | null;

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

  // Figure-specific (null for vehicles/playsets)
  @Column({ type: 'enum', enum: FigureSize, nullable: true })
  figureSize!: FigureSize | null;

  @Column({ type: 'enum', enum: CardbackStyle, nullable: true })
  cardbackStyle!: CardbackStyle | null;

  @Column({ type: 'varchar', nullable: true })
  kennerItemNumber!: string | null;

  @Column({ type: 'boolean', nullable: true })
  coinIncluded!: boolean | null;

  // Vehicle/Playset-specific (null for basic figures)
  @Column('text', { array: true, default: '{}' })
  features!: string[];

  @OneToMany(() => UserStarWarsItemEntity, (item) => item.catalog)
  userItems!: UserStarWarsItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
