import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CollectionType, ConditionGrade, PaginatedResponse, StarWarsLine } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { User } from '../../auth/entities/user.entity';
import { CreateStarWarsFigureDto, UpdateStarWarsFigureDto } from '../dto/star-wars-figure.dto';
import { StarWarsFigureEntity } from '../entities/star-wars-figure.entity';

export interface StarWarsFilters {
  owned?: boolean;
  condition?: ConditionGrade;
  line?: StarWarsLine;
}

@Injectable()
export class StarWarsService {
  constructor(
    @InjectRepository(StarWarsFigureEntity)
    private readonly repo: Repository<StarWarsFigureEntity>,
  ) {}

  async findAll(
    userId: string,
    filters: StarWarsFilters,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<StarWarsFigureEntity>> {
    const { page = 1, limit = 20 } = pagination;
    const where: FindOptionsWhere<StarWarsFigureEntity> = { user: { id: userId } };
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

  async findOne(userId: string, id: string): Promise<StarWarsFigureEntity> {
    const item = await this.repo.findOne({ where: { id, user: { id: userId } } });
    if (!item) throw new NotFoundException(`Star Wars figure ${id} not found`);
    return item;
  }

  async create(userId: string, dto: CreateStarWarsFigureDto): Promise<StarWarsFigureEntity> {
    const item = this.repo.create({
      ...dto,
      collectionType: CollectionType.STAR_WARS,
      accessories: dto.accessories ?? [],
      ownedAccessories: dto.ownedAccessories ?? [],
      photoUrls: dto.photoUrls ?? [],
      user: { id: userId } as User,
    });
    return this.repo.save(item);
  }

  async update(userId: string, id: string, dto: UpdateStarWarsFigureDto): Promise<StarWarsFigureEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.findOne(userId, id);
    await this.repo.remove(item);
  }
}
