import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionItem, CollectionType, PaginatedResponse } from '@my-collections/shared';
import { CollectionSearchQueryDto } from '../dto/collection-search-query.dto';
import { UserStarWarsItemEntity } from '../entities/user-star-wars-item.entity';
import { UserG1TransformersItemEntity } from '../entities/user-g1-transformers-item.entity';
import { UserMastersItemEntity } from '../entities/user-masters-item.entity';

@Injectable()
export class CollectionsSearchService {
  constructor(
    @InjectRepository(UserStarWarsItemEntity)
    private readonly swRepo: Repository<UserStarWarsItemEntity>,
    @InjectRepository(UserG1TransformersItemEntity)
    private readonly tfRepo: Repository<UserG1TransformersItemEntity>,
    @InjectRepository(UserMastersItemEntity)
    private readonly hmRepo: Repository<UserMastersItemEntity>,
  ) {}

  async search(userId: string, query: CollectionSearchQueryDto): Promise<PaginatedResponse<CollectionItem>> {
    const { q, collectionType, condition, isOwned, isComplete, page = 1, limit = 20 } = query;

    const filters = { q, condition, isOwned, isComplete };
    const pagination = { page, limit };

    const [[swItems, swCount], [tfItems, tfCount], [hmItems, hmCount]] = await Promise.all([
      collectionType && collectionType !== CollectionType.STAR_WARS
        ? [[], 0] as [CollectionItem[], number]
        : this.queryStarWars(userId, filters, pagination),
      collectionType && collectionType !== CollectionType.TRANSFORMERS
        ? [[], 0] as [CollectionItem[], number]
        : this.queryTransformers(userId, filters, pagination),
      collectionType && collectionType !== CollectionType.HE_MAN
        ? [[], 0] as [CollectionItem[], number]
        : this.queryMasters(userId, filters, pagination),
    ]);

    const total = swCount + tfCount + hmCount;
    const data = [...swItems, ...tfItems, ...hmItems]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private async queryStarWars(
    userId: string,
    filters: { q?: string; condition?: string; isOwned?: boolean; isComplete?: boolean },
    pagination: { page: number; limit: number },
  ): Promise<[CollectionItem[], number]> {
    const { q, condition, isOwned, isComplete } = filters;
    const { page, limit } = pagination;

    const qb = this.swRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.catalog', 'catalog')
      .where('item.userId = :userId', { userId });

    if (isOwned !== undefined) qb.andWhere('item.isOwned = :isOwned', { isOwned });
    if (isComplete !== undefined) qb.andWhere('item.isComplete = :isComplete', { isComplete });
    if (condition) qb.andWhere('item.condition = :condition', { condition });
    if (q) {
      qb.andWhere(
        '(LOWER(catalog.name) LIKE :q OR LOWER(item.notes) LIKE :q)',
        { q: `%${q.toLowerCase()}%` },
      );
    }

    const [entities, count] = await qb
      .orderBy('catalog.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return [entities.map((item) => ({
      id: item.id,
      name: item.catalog.name,
      collectionType: CollectionType.STAR_WARS,
      condition: item.condition ?? undefined,
      packagingCondition: item.packagingCondition ?? undefined,
      isOwned: item.isOwned,
      isComplete: item.isComplete,
      acquisitionSource: item.acquisitionSource ?? undefined,
      acquisitionDate: item.acquisitionDate ?? undefined,
      acquisitionPrice: item.acquisitionPrice ?? undefined,
      estimatedValue: item.estimatedValue ?? undefined,
      isVariant: item.catalog.isVariant,
      notes: item.notes ?? undefined,
      photoUrls: item.photoUrls,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    })), count];
  }

  private async queryTransformers(
    userId: string,
    filters: { q?: string; condition?: string; isOwned?: boolean; isComplete?: boolean },
    pagination: { page: number; limit: number },
  ): Promise<[CollectionItem[], number]> {
    const { q, condition, isOwned, isComplete } = filters;
    const { page, limit } = pagination;

    const qb = this.tfRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.catalog', 'catalog')
      .where('item.userId = :userId', { userId });

    if (isOwned !== undefined) qb.andWhere('item.isOwned = :isOwned', { isOwned });
    if (isComplete !== undefined) qb.andWhere('item.isComplete = :isComplete', { isComplete });
    if (condition) qb.andWhere('item.condition = :condition', { condition });
    if (q) {
      qb.andWhere(
        '(LOWER(catalog.name) LIKE :q OR LOWER(item.notes) LIKE :q)',
        { q: `%${q.toLowerCase()}%` },
      );
    }

    const [entities, count] = await qb
      .orderBy('catalog.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return [entities.map((item) => ({
      id: item.id,
      name: item.catalog.name,
      collectionType: CollectionType.TRANSFORMERS,
      condition: item.condition ?? undefined,
      packagingCondition: item.packagingCondition ?? undefined,
      isOwned: item.isOwned,
      isComplete: item.isComplete,
      acquisitionSource: item.acquisitionSource ?? undefined,
      acquisitionDate: item.acquisitionDate ?? undefined,
      acquisitionPrice: item.acquisitionPrice ?? undefined,
      estimatedValue: item.estimatedValue ?? undefined,
      isVariant: item.catalog.isVariant,
      notes: item.notes ?? undefined,
      photoUrls: item.photoUrls,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    })), count];
  }

  private async queryMasters(
    userId: string,
    filters: { q?: string; condition?: string; isOwned?: boolean; isComplete?: boolean },
    pagination: { page: number; limit: number },
  ): Promise<[CollectionItem[], number]> {
    const { q, condition, isOwned, isComplete } = filters;
    const { page, limit } = pagination;

    const qb = this.hmRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.catalog', 'catalog')
      .where('item.userId = :userId', { userId });

    if (isOwned !== undefined) qb.andWhere('item.isOwned = :isOwned', { isOwned });
    if (isComplete !== undefined) qb.andWhere('item.isComplete = :isComplete', { isComplete });
    if (condition) qb.andWhere('item.condition = :condition', { condition });
    if (q) {
      qb.andWhere(
        '(LOWER(catalog.name) LIKE :q OR LOWER(item.notes) LIKE :q)',
        { q: `%${q.toLowerCase()}%` },
      );
    }

    const [entities, count] = await qb
      .orderBy('catalog.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return [entities.map((item) => ({
      id: item.id,
      name: item.catalog.name,
      collectionType: CollectionType.HE_MAN,
      condition: item.condition ?? undefined,
      packagingCondition: item.packagingCondition ?? undefined,
      isOwned: item.isOwned,
      isComplete: item.isComplete,
      acquisitionSource: item.acquisitionSource ?? undefined,
      acquisitionDate: item.acquisitionDate ?? undefined,
      acquisitionPrice: item.acquisitionPrice ?? undefined,
      estimatedValue: item.estimatedValue ?? undefined,
      isVariant: item.catalog.isVariant,
      notes: item.notes ?? undefined,
      photoUrls: item.photoUrls,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    })), count];
  }
}
