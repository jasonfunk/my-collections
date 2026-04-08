import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserMastersItemEntity } from './user-masters-item.entity';

// TODO: expand with full field set when Masters scraper lands (COL-xx)
@Entity('masters_catalog')
export class MastersCatalogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany(() => UserMastersItemEntity, (item) => item.catalog)
  userItems!: UserMastersItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
