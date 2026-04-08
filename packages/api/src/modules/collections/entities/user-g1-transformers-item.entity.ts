import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { G1TransformersCatalogEntity } from './g1-transformers-catalog.entity';

// TODO: expand with full field set when G1 Transformers scraper lands (COL-xx)
@Entity('user_g1_transformers_items')
export class UserG1TransformersItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => G1TransformersCatalogEntity, (catalog) => catalog.userItems, { nullable: false })
  catalog!: G1TransformersCatalogEntity;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  @Column({ default: false })
  isOwned!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
