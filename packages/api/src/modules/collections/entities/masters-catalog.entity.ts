import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MastersCharacterType, MastersLine } from '@my-collections/shared';
import { UserMastersItemEntity } from './user-masters-item.entity';

@Entity('masters_catalog')
export class MastersCatalogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: MastersLine, nullable: true })
  line!: MastersLine | null;

  @Column({ type: 'enum', enum: MastersCharacterType, nullable: true })
  characterType!: MastersCharacterType | null;

  @Column({ type: 'int', nullable: true })
  releaseYear!: number | null;

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

  @Column({ type: 'varchar', nullable: true })
  miniComic!: string | null;

  @Column({ default: false })
  hasArmorOrFeature!: boolean;

  @Column({ type: 'text', nullable: true })
  featureDescription!: string | null;

  @OneToMany(() => UserMastersItemEntity, (item) => item.catalog)
  userItems!: UserMastersItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
