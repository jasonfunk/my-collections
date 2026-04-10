import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { User } from '../../auth/entities/user.entity';
import { G1TransformersCatalogEntity } from '../entities/g1-transformers-catalog.entity';
import { UserG1TransformersItemEntity } from '../entities/user-g1-transformers-item.entity';
import {
  CreateUserG1TransformersItemDto,
  MarkG1TransformerAcquiredDto,
  UpdateUserG1TransformersItemDto,
} from '../dto/g1-transformer.dto';

@Injectable()
export class UserG1TransformersItemsService {
  constructor(
    @InjectRepository(UserG1TransformersItemEntity)
    private readonly repo: Repository<UserG1TransformersItemEntity>,
    @InjectRepository(G1TransformersCatalogEntity)
    private readonly catalogRepo: Repository<G1TransformersCatalogEntity>,
  ) {}

  async findAll(userId: string, pagination: PaginationQueryDto): Promise<PaginatedResponse<UserG1TransformersItemEntity>> {
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

  async findWishlist(userId: string, pagination: PaginationQueryDto): Promise<PaginatedResponse<UserG1TransformersItemEntity>> {
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

  async findOne(userId: string, id: string): Promise<UserG1TransformersItemEntity> {
    const item = await this.repo.findOne({
      where: { id, user: { id: userId } },
      relations: ['catalog'],
    });
    if (!item) throw new NotFoundException(`G1 Transformers item ${id} not found`);
    return item;
  }

  async create(userId: string, dto: CreateUserG1TransformersItemDto): Promise<UserG1TransformersItemEntity> {
    const catalog = await this.catalogRepo.findOne({ where: { id: dto.catalogId } });
    if (!catalog) throw new NotFoundException(`Catalog item ${dto.catalogId} not found`);

    const existing = await this.repo.findOne({
      where: { catalog: { id: dto.catalogId }, user: { id: userId } },
    });
    if (existing) throw new ConflictException('You already have a record for this catalog item');

    const item = this.repo.create({
      ...dto,
      catalog: { id: dto.catalogId } as G1TransformersCatalogEntity,
      user: { id: userId } as User,
      ownedAccessories: dto.ownedAccessories ?? [],
      photoUrls: dto.photoUrls ?? [],
    });
    const saved = await this.repo.save(item);
    return this.repo.findOne({ where: { id: saved.id }, relations: ['catalog'] }) as Promise<UserG1TransformersItemEntity>;
  }

  async update(userId: string, id: string, dto: UpdateUserG1TransformersItemDto): Promise<UserG1TransformersItemEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async markAcquired(userId: string, id: string, dto: MarkG1TransformerAcquiredDto): Promise<UserG1TransformersItemEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto, { isOwned: true, wishlistPriority: null });
    return this.repo.save(item);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.findOne(userId, id);
    await this.repo.remove(item);
  }
}
