import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionStats, CollectionTypeStats } from '@my-collections/shared';
import { G1TransformerEntity } from '../entities/g1-transformer.entity';
import { MastersFigureEntity } from '../entities/masters-figure.entity';
import { StarWarsFigureEntity } from '../entities/star-wars-figure.entity';

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
    @InjectRepository(StarWarsFigureEntity)
    private readonly swRepo: Repository<StarWarsFigureEntity>,
    @InjectRepository(G1TransformerEntity)
    private readonly tfRepo: Repository<G1TransformerEntity>,
    @InjectRepository(MastersFigureEntity)
    private readonly motuRepo: Repository<MastersFigureEntity>,
  ) {}

  async getStats(userId: string): Promise<CollectionStats> {
    const [swRows, tfRows, motuRows] = await Promise.all([
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
      this.motuRepo
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
    const heman = parseStatsRows(motuRows);

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
