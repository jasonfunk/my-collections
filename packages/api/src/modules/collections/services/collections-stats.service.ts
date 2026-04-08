import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionStats, CollectionTypeStats } from '@my-collections/shared';
import { UserStarWarsItemEntity } from '../entities/user-star-wars-item.entity';

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

const EMPTY_STATS: CollectionTypeStats = { owned: 0, wishlist: 0, estimatedTotalValue: null };

@Injectable()
export class CollectionsStatsService {
  constructor(
    @InjectRepository(UserStarWarsItemEntity)
    private readonly swRepo: Repository<UserStarWarsItemEntity>,
  ) {}

  async getStats(userId: string): Promise<CollectionStats> {
    const swRows = await this.swRepo
      .createQueryBuilder('item')
      .select('item.isOwned', 'isOwned')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(item.estimatedValue)', 'totalValue')
      .where('item.userId = :userId', { userId })
      .groupBy('item.isOwned')
      .getRawMany<StatsRow>();

    const starWars = parseStatsRows(swRows);
    // TODO: query real G1/Masters user_items once their scrapers land
    const transformers = EMPTY_STATS;
    const heman = EMPTY_STATS;

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
}
