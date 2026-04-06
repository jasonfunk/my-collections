import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { CollectionItem, CollectionType, PaginatedResponse } from '@my-collections/shared';
import { CollectionSearchQueryDto } from '../dto/collection-search-query.dto';
import { G1TransformerEntity } from '../entities/g1-transformer.entity';
import { MastersFigureEntity } from '../entities/masters-figure.entity';
import { StarWarsFigureEntity } from '../entities/star-wars-figure.entity';

@Injectable()
export class CollectionsSearchService {
  constructor(
    @InjectRepository(StarWarsFigureEntity)
    private readonly swRepo: Repository<StarWarsFigureEntity>,
    @InjectRepository(G1TransformerEntity)
    private readonly tfRepo: Repository<G1TransformerEntity>,
    @InjectRepository(MastersFigureEntity)
    private readonly motuRepo: Repository<MastersFigureEntity>,
  ) {}

  async search(userId: string, query: CollectionSearchQueryDto): Promise<PaginatedResponse<CollectionItem>> {
    const { q, collectionType, condition, isOwned, isComplete, page = 1, limit = 20 } = query;

    const buildQuery = <T extends ObjectLiteral>(repo: Repository<T>, type: CollectionType) => {
      if (collectionType && collectionType !== type) return Promise.resolve([] as T[]);
      const qb = repo
        .createQueryBuilder('item')
        .where('item.userId = :userId', { userId });
      if (condition) qb.andWhere('item.condition = :condition', { condition });
      if (isOwned !== undefined) qb.andWhere('item.isOwned = :isOwned', { isOwned });
      if (isComplete !== undefined) qb.andWhere('item.isComplete = :isComplete', { isComplete });
      if (q) {
        qb.andWhere('(LOWER(item.name) LIKE :q OR LOWER(item.notes) LIKE :q)', {
          q: `%${q.toLowerCase()}%`,
        });
      }
      return qb.getMany();
    };

    const [swItems, tfItems, motuItems] = await Promise.all([
      buildQuery(this.swRepo, CollectionType.STAR_WARS),
      buildQuery(this.tfRepo, CollectionType.TRANSFORMERS),
      buildQuery(this.motuRepo, CollectionType.HE_MAN),
    ]);

    const all = ([...swItems, ...tfItems, ...motuItems] as unknown as CollectionItem[]).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
