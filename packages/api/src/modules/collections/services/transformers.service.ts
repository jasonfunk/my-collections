import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CollectionType, ConditionGrade, TransformersFaction, TransformersLine } from '@my-collections/shared';
import { User } from '../../auth/entities/user.entity';
import { CreateG1TransformerDto, UpdateG1TransformerDto } from '../dto/g1-transformer.dto';
import { G1TransformerEntity } from '../entities/g1-transformer.entity';

export interface TransformersFilters {
  owned?: boolean;
  condition?: ConditionGrade;
  faction?: TransformersFaction;
  line?: TransformersLine;
}

@Injectable()
export class TransformersService {
  constructor(
    @InjectRepository(G1TransformerEntity)
    private readonly repo: Repository<G1TransformerEntity>,
  ) {}

  async findAll(userId: string, filters: TransformersFilters): Promise<G1TransformerEntity[]> {
    const where: FindOptionsWhere<G1TransformerEntity> = { user: { id: userId } };
    if (filters.owned !== undefined) where.isOwned = filters.owned;
    if (filters.condition) where.condition = filters.condition;
    if (filters.faction) where.faction = filters.faction;
    if (filters.line) where.line = filters.line;
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(userId: string, id: string): Promise<G1TransformerEntity> {
    const item = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!item) throw new NotFoundException(`G1 Transformer ${id} not found`);
    return item;
  }

  async create(userId: string, dto: CreateG1TransformerDto): Promise<G1TransformerEntity> {
    const item = this.repo.create({
      ...dto,
      collectionType: CollectionType.TRANSFORMERS,
      accessories: dto.accessories ?? [],
      ownedAccessories: dto.ownedAccessories ?? [],
      photoUrls: dto.photoUrls ?? [],
      user: { id: userId } as User,
    });
    return this.repo.save(item);
  }

  async update(userId: string, id: string, dto: UpdateG1TransformerDto): Promise<G1TransformerEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.findOne(userId, id);
    await this.repo.remove(item);
  }
}
