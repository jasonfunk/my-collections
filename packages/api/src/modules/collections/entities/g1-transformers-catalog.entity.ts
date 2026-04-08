import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserG1TransformersItemEntity } from './user-g1-transformers-item.entity';

// TODO: expand with full field set when G1 Transformers scraper lands (COL-xx)
@Entity('g1_transformers_catalog')
export class G1TransformersCatalogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany(() => UserG1TransformersItemEntity, (item) => item.catalog)
  userItems!: UserG1TransformersItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
