import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionItem, CollectionType, PaginatedResponse } from '@my-collections/shared';
import { CollectionSearchQueryDto } from '../dto/collection-search-query.dto';
import { UserStarWarsItemEntity } from '../entities/user-star-wars-item.entity';

@Injectable()
export class CollectionsSearchService {
  constructor(
    @InjectRepository(UserStarWarsItemEntity)
    private readonly swRepo: Repository<UserStarWarsItemEntity>,
  ) {}

  async search(userId: string, query: CollectionSearchQueryDto): Promise<PaginatedResponse<CollectionItem>> {
    const { q, collectionType, condition, isOwned, isComplete, page = 1, limit = 20 } = query;

    // If filtering to a non-SW collection, stubs have no user items yet
    const swItems =
      collectionType && collectionType !== CollectionType.STAR_WARS
        ? []
        : await this.queryStarWars(userId, { q, condition, isOwned, isComplete });

    // TODO: add Transformers + He-Man queries once scrapers land

    const all = swItems.sort((a, b) => a.name.localeCompare(b.name));
    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  private async queryStarWars(
    userId: string,
    filters: { q?: string; condition?: string; isOwned?: boolean; isComplete?: boolean },
  ): Promise<CollectionItem[]> {
    const { q, condition, isOwned, isComplete } = filters;

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

    const items = await qb.getMany();
    return items.map((item) => this.toCollectionItem(item));
  }

  private toCollectionItem(item: UserStarWarsItemEntity): CollectionItem {
    return {
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
    };
  }
}
