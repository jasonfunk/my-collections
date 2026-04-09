import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { User } from '../../auth/entities/user.entity';
import { StarWarsCatalogEntity } from '../entities/star-wars-catalog.entity';
import { UserStarWarsItemEntity } from '../entities/user-star-wars-item.entity';
import { CreateUserStarWarsItemDto, MarkAcquiredDto, UpdateUserStarWarsItemDto } from '../dto/star-wars-catalog.dto';

@Injectable()
export class UserStarWarsItemsService {
  constructor(
    @InjectRepository(UserStarWarsItemEntity)
    private readonly repo: Repository<UserStarWarsItemEntity>,
    @InjectRepository(StarWarsCatalogEntity)
    private readonly catalogRepo: Repository<StarWarsCatalogEntity>,
  ) {}

  async findAll(userId: string, pagination: PaginationQueryDto): Promise<PaginatedResponse<UserStarWarsItemEntity>> {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.repo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.catalog', 'catalog')
      .where('item.userId = :userId', { userId })
      .orderBy('catalog.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findWishlist(userId: string, pagination: PaginationQueryDto): Promise<PaginatedResponse<UserStarWarsItemEntity>> {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.repo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.catalog', 'catalog')
      .addSelect(
        `CASE "item"."wishlistPriority" WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END`,
        'priority_order',
      )
      .where('item.userId = :userId', { userId })
      .andWhere('item.isOwned = false')
      .orderBy('priority_order', 'ASC')
      .addOrderBy('catalog.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async markAcquired(userId: string, id: string, dto: MarkAcquiredDto): Promise<UserStarWarsItemEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto, { isOwned: true, wishlistPriority: null });
    return this.repo.save(item);
  }

  async findOne(userId: string, id: string): Promise<UserStarWarsItemEntity> {
    const item = await this.repo.findOne({
      where: { id, user: { id: userId } },
      relations: ['catalog'],
    });
    if (!item) throw new NotFoundException(`Star Wars item ${id} not found`);
    return item;
  }

  async create(userId: string, dto: CreateUserStarWarsItemDto): Promise<UserStarWarsItemEntity> {
    const catalog = await this.catalogRepo.findOne({ where: { id: dto.catalogId } });
    if (!catalog) throw new NotFoundException(`Catalog item ${dto.catalogId} not found`);

    const existing = await this.repo.findOne({
      where: { catalog: { id: dto.catalogId }, user: { id: userId } },
    });
    if (existing) throw new ConflictException('You already have a record for this catalog item');

    const item = this.repo.create({
      ...dto,
      catalog: { id: dto.catalogId } as StarWarsCatalogEntity,
      user: { id: userId } as User,
      ownedAccessories: dto.ownedAccessories ?? [],
      photoUrls: dto.photoUrls ?? [],
    });
    const saved = await this.repo.save(item);
    return this.repo.findOne({ where: { id: saved.id }, relations: ['catalog'] }) as Promise<UserStarWarsItemEntity>;
  }

  async update(userId: string, id: string, dto: UpdateUserStarWarsItemDto): Promise<UserStarWarsItemEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.findOne(userId, id);
    await this.repo.remove(item);
  }
}
