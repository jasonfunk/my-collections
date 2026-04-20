import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionStats, CollectionType, CollectionTypeStats, RecentCollectionItem } from '@my-collections/shared';
import { UserStarWarsItemEntity } from '../entities/user-star-wars-item.entity';
import { UserG1TransformersItemEntity } from '../entities/user-g1-transformers-item.entity';
import { UserMastersItemEntity } from '../entities/user-masters-item.entity';

type StatsRow = { isOwned: boolean; count: string; totalValue: string | null };

function parseStatsRows(rows: StatsRow[]): CollectionTypeStats {
  let owned = 0;
  let wishlist = 0;
  const values: number[] = [];

  for (const row of rows) {
    const count = parseInt(row.count, 10);
    if (row.isOwned) {
      owned = count;
    } else {
      wishlist = count;
    }
    if (row.totalValue != null) {
      values.push(parseFloat(row.totalValue));
    }
  }

  return {
    owned,
    wishlist,
    estimatedTotalValue: values.length > 0 ? values.reduce((a, b) => a + b, 0) : null,
  };
}

@Injectable()
export class CollectionsStatsService {
  constructor(
    @InjectRepository(UserStarWarsItemEntity)
    private readonly swRepo: Repository<UserStarWarsItemEntity>,
    @InjectRepository(UserG1TransformersItemEntity)
    private readonly tfRepo: Repository<UserG1TransformersItemEntity>,
    @InjectRepository(UserMastersItemEntity)
    private readonly hmRepo: Repository<UserMastersItemEntity>,
  ) {}

  async getStats(userId: string): Promise<CollectionStats> {
    const [swRows, tfRows, hmRows] = await Promise.all([
      this.swRepo
        .createQueryBuilder('item')
        .select('item.isOwned', 'isOwned')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(item.estimatedValue)', 'totalValue')
        .where('item.userId = :userId', { userId })
        .groupBy('item.isOwned')
        .getRawMany<StatsRow>(),
      this.tfRepo
        .createQueryBuilder('item')
        .select('item.isOwned', 'isOwned')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(item.estimatedValue)', 'totalValue')
        .where('item.userId = :userId', { userId })
        .groupBy('item.isOwned')
        .getRawMany<StatsRow>(),
      this.hmRepo
        .createQueryBuilder('item')
        .select('item.isOwned', 'isOwned')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(item.estimatedValue)', 'totalValue')
        .where('item.userId = :userId', { userId })
        .groupBy('item.isOwned')
        .getRawMany<StatsRow>(),
    ]);

    const starWars = parseStatsRows(swRows);
    const transformers = parseStatsRows(tfRows);
    const heman = parseStatsRows(hmRows);

    const values = [
      starWars.estimatedTotalValue,
      transformers.estimatedTotalValue,
      heman.estimatedTotalValue,
    ].filter((v): v is number => v !== null);

    return {
      starWars,
      transformers,
      heman,
      totals: {
        owned: starWars.owned + transformers.owned + heman.owned,
        wishlist: starWars.wishlist + transformers.wishlist + heman.wishlist,
        estimatedTotalValue: values.length > 0 ? values.reduce((a, b) => a + b, 0) : null,
      },
    };
  }

  async getRecentItems(userId: string, limit: number): Promise<RecentCollectionItem[]> {
    const [swItems, tfItems, hmItems] = await Promise.all([
      this.swRepo
        .createQueryBuilder('item')
        .innerJoin('item.catalog', 'catalog')
        .select(['item.id', 'item.isOwned', 'item.condition', 'item.createdAt', 'catalog.name'])
        .where('item.userId = :userId', { userId })
        .orderBy('item.createdAt', 'DESC')
        .take(limit)
        .getMany(),
      this.tfRepo
        .createQueryBuilder('item')
        .innerJoin('item.catalog', 'catalog')
        .select(['item.id', 'item.isOwned', 'item.condition', 'item.createdAt', 'catalog.name'])
        .where('item.userId = :userId', { userId })
        .orderBy('item.createdAt', 'DESC')
        .take(limit)
        .getMany(),
      this.hmRepo
        .createQueryBuilder('item')
        .innerJoin('item.catalog', 'catalog')
        .select(['item.id', 'item.isOwned', 'item.condition', 'item.createdAt', 'catalog.name'])
        .where('item.userId = :userId', { userId })
        .orderBy('item.createdAt', 'DESC')
        .take(limit)
        .getMany(),
    ]);

    const all: RecentCollectionItem[] = [
      ...swItems.map((item) => ({
        id: item.id,
        name: item.catalog.name,
        collectionType: CollectionType.STAR_WARS,
        isOwned: item.isOwned,
        condition: item.condition ?? undefined,
        createdAt: item.createdAt.toISOString(),
      })),
      ...tfItems.map((item) => ({
        id: item.id,
        name: item.catalog.name,
        collectionType: CollectionType.TRANSFORMERS,
        isOwned: item.isOwned,
        condition: item.condition ?? undefined,
        createdAt: item.createdAt.toISOString(),
      })),
      ...hmItems.map((item) => ({
        id: item.id,
        name: item.catalog.name,
        collectionType: CollectionType.HE_MAN,
        isOwned: item.isOwned,
        condition: item.condition ?? undefined,
        createdAt: item.createdAt.toISOString(),
      })),
    ];

    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
}
