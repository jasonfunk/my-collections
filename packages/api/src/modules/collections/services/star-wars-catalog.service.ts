import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@my-collections/shared';
import { StarWarsCatalogEntity } from '../entities/star-wars-catalog.entity';
import { CatalogBrowseQueryDto } from '../dto/star-wars-catalog.dto';

@Injectable()
export class StarWarsCatalogService {
  constructor(
    @InjectRepository(StarWarsCatalogEntity)
    private readonly repo: Repository<StarWarsCatalogEntity>,
  ) {}

  async findAll(query: CatalogBrowseQueryDto): Promise<PaginatedResponse<StarWarsCatalogEntity>> {
    const { page = 1, limit = 20, category, line } = query;
    const qb = this.repo
      .createQueryBuilder('item')
      .orderBy('item.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (category) qb.andWhere('item.category = :category', { category });
    if (line) qb.andWhere('item.line = :line', { line });
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string): Promise<StarWarsCatalogEntity> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Star Wars catalog item ${id} not found`);
    return item;
  }
}
