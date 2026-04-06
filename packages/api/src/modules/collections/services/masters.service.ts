import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CollectionType, ConditionGrade, MastersLine, PaginatedResponse } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { User } from '../../auth/entities/user.entity';
import { CreateMastersFigureDto, UpdateMastersFigureDto } from '../dto/masters-figure.dto';
import { MastersFigureEntity } from '../entities/masters-figure.entity';

export interface MastersFilters {
  owned?: boolean;
  condition?: ConditionGrade;
  line?: MastersLine;
}

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(MastersFigureEntity)
    private readonly repo: Repository<MastersFigureEntity>,
  ) {}

  async findAll(
    userId: string,
    filters: MastersFilters,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<MastersFigureEntity>> {
    const { page = 1, limit = 20 } = pagination;
    const where: FindOptionsWhere<MastersFigureEntity> = { user: { id: userId } };
    if (filters.owned !== undefined) where.isOwned = filters.owned;
    if (filters.condition) where.condition = filters.condition;
    if (filters.line) where.line = filters.line;
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string): Promise<MastersFigureEntity> {
    const item = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!item) throw new NotFoundException(`Masters figure ${id} not found`);
    return item;
  }

  async create(userId: string, dto: CreateMastersFigureDto): Promise<MastersFigureEntity> {
    const item = this.repo.create({
      ...dto,
      collectionType: CollectionType.HE_MAN,
      accessories: dto.accessories ?? [],
      ownedAccessories: dto.ownedAccessories ?? [],
      photoUrls: dto.photoUrls ?? [],
      user: { id: userId } as User,
    });
    return this.repo.save(item);
  }

  async update(userId: string, id: string, dto: UpdateMastersFigureDto): Promise<MastersFigureEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.findOne(userId, id);
    await this.repo.remove(item);
  }
}
