import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { User } from '../../auth/entities/user.entity';
import { MastersCatalogEntity } from '../entities/masters-catalog.entity';
import { UserMastersItemEntity } from '../entities/user-masters-item.entity';
import {
  CreateUserMastersItemDto,
  MarkMastersAcquiredDto,
  UpdateUserMastersItemDto,
} from '../dto/masters-catalog.dto';

@Injectable()
export class UserMastersItemsService {
  constructor(
    @InjectRepository(UserMastersItemEntity)
    private readonly repo: Repository<UserMastersItemEntity>,
    @InjectRepository(MastersCatalogEntity)
    private readonly catalogRepo: Repository<MastersCatalogEntity>,
  ) {}

  async findAll(userId: string, pagination: PaginationQueryDto): Promise<PaginatedResponse<UserMastersItemEntity>> {
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

  async findWishlist(userId: string, pagination: PaginationQueryDto): Promise<PaginatedResponse<UserMastersItemEntity>> {
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

  async findOne(userId: string, id: string): Promise<UserMastersItemEntity> {
    const item = await this.repo.findOne({
      where: { id, user: { id: userId } },
      relations: ['catalog'],
    });
    if (!item) throw new NotFoundException(`Masters item ${id} not found`);
    return item;
  }

  async create(userId: string, dto: CreateUserMastersItemDto): Promise<UserMastersItemEntity> {
    const catalog = await this.catalogRepo.findOne({ where: { id: dto.catalogId } });
    if (!catalog) throw new NotFoundException(`Catalog item ${dto.catalogId} not found`);

    const existing = await this.repo.findOne({
      where: { catalog: { id: dto.catalogId }, user: { id: userId } },
    });
    if (existing) throw new ConflictException('You already have a record for this catalog item');

    const item = this.repo.create({
      ...dto,
      catalog: { id: dto.catalogId } as MastersCatalogEntity,
      user: { id: userId } as User,
      ownedAccessories: dto.ownedAccessories ?? [],
      photoUrls: dto.photoUrls ?? [],
    });
    const saved = await this.repo.save(item);
    return this.repo.findOne({ where: { id: saved.id }, relations: ['catalog'] }) as Promise<UserMastersItemEntity>;
  }

  async update(userId: string, id: string, dto: UpdateUserMastersItemDto): Promise<UserMastersItemEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async markAcquired(userId: string, id: string, dto: MarkMastersAcquiredDto): Promise<UserMastersItemEntity> {
    const item = await this.findOne(userId, id);
    Object.assign(item, dto, { isOwned: true, wishlistPriority: null });
    return this.repo.save(item);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.findOne(userId, id);
    await this.repo.remove(item);
  }
}
