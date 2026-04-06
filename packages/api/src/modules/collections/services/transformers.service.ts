import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcquisitionSource, CollectionType, ConditionGrade, PaginatedResponse, TransformersFaction, TransformersLine } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { User } from '../../auth/entities/user.entity';
import { CreateG1TransformerDto, UpdateG1TransformerDto } from '../dto/g1-transformer.dto';
import { G1TransformerEntity } from '../entities/g1-transformer.entity';

export interface TransformersFilters {
  owned?: boolean;
  condition?: ConditionGrade;
  faction?: TransformersFaction;
  line?: TransformersLine;
  acquisitionSource?: AcquisitionSource;
  isComplete?: boolean;
  search?: string;
}

@Injectable()
export class TransformersService {
  constructor(
    @InjectRepository(G1TransformerEntity)
    private readonly repo: Repository<G1TransformerEntity>,
  ) {}

  async findAll(
    userId: string,
    filters: TransformersFilters,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<G1TransformerEntity>> {
    const { page = 1, limit = 20 } = pagination;
    const qb = this.repo
      .createQueryBuilder('item')
      .where('item.userId = :userId', { userId })
      .orderBy('item.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (filters.owned !== undefined) qb.andWhere('item.isOwned = :owned', { owned: filters.owned });
    if (filters.condition) qb.andWhere('item.condition = :condition', { condition: filters.condition });
    if (filters.faction) qb.andWhere('item.faction = :faction', { faction: filters.faction });
    if (filters.line) qb.andWhere('item.line = :line', { line: filters.line });
    if (filters.acquisitionSource) qb.andWhere('item.acquisitionSource = :src', { src: filters.acquisitionSource });
    if (filters.isComplete !== undefined) qb.andWhere('item.isComplete = :ic', { ic: filters.isComplete });
    if (filters.search) {
      qb.andWhere('(LOWER(item.name) LIKE :search OR LOWER(item.notes) LIKE :search)', {
        search: `%${filters.search.toLowerCase()}%`,
      });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
