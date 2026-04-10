import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@my-collections/shared';
import { G1TransformersCatalogEntity } from '../entities/g1-transformers-catalog.entity';
import { G1TransformersCatalogBrowseQueryDto } from '../dto/g1-transformer.dto';

@Injectable()
export class G1TransformersCatalogService {
  constructor(
    @InjectRepository(G1TransformersCatalogEntity)
    private readonly repo: Repository<G1TransformersCatalogEntity>,
  ) {}

  async findAll(query: G1TransformersCatalogBrowseQueryDto): Promise<PaginatedResponse<G1TransformersCatalogEntity>> {
    const { page = 1, limit = 20, faction, line, search } = query;
    const qb = this.repo
      .createQueryBuilder('item')
      .orderBy('item.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (faction) qb.andWhere('item.faction = :faction', { faction });
    if (line) qb.andWhere('item.line = :line', { line });
    if (search) qb.andWhere('LOWER(item.name) LIKE :search', { search: `%${search.toLowerCase()}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string): Promise<G1TransformersCatalogEntity> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`G1 Transformers catalog item ${id} not found`);
    return item;
  }
}
