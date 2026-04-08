import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionItem, PaginatedResponse } from '@my-collections/shared';
import { CollectionSearchQueryDto } from '../dto/collection-search-query.dto';
import { UserStarWarsItemEntity } from '../entities/user-star-wars-item.entity';

@Injectable()
export class CollectionsSearchService {
  constructor(
    @InjectRepository(UserStarWarsItemEntity)
    private readonly swRepo: Repository<UserStarWarsItemEntity>,
  ) {}

  async search(userId: string, query: CollectionSearchQueryDto): Promise<PaginatedResponse<CollectionItem>> {
    const { q, isOwned, isComplete, page = 1, limit = 20 } = query;

    const qb = this.swRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.catalog', 'catalog')
      .where('item.userId = :userId', { userId });

    if (isOwned !== undefined) qb.andWhere('item.isOwned = :isOwned', { isOwned });
    if (isComplete !== undefined) qb.andWhere('item.isComplete = :isComplete', { isComplete });
    if (q) {
      qb.andWhere('LOWER(catalog.name) LIKE :q', { q: `%${q.toLowerCase()}%` });
    }

    const swItems = await qb.getMany();

    // TODO: search G1/Masters user_items once their scrapers land
    const all = (swItems as unknown as CollectionItem[]).sort((a, b) => a.name.localeCompare(b.name));
    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
