import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@my-collections/shared';
import { MastersCatalogEntity } from '../entities/masters-catalog.entity';
import { MastersCatalogBrowseQueryDto } from '../dto/masters-catalog.dto';

@Injectable()
export class MastersCatalogService {
  constructor(
    @InjectRepository(MastersCatalogEntity)
    private readonly repo: Repository<MastersCatalogEntity>,
  ) {}

  async findAll(query: MastersCatalogBrowseQueryDto): Promise<PaginatedResponse<MastersCatalogEntity>> {
    const { page = 1, limit = 20, line, characterType, search } = query;
    const qb = this.repo
      .createQueryBuilder('item')
      .orderBy('item.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (line) qb.andWhere('item.line = :line', { line });
    if (characterType) qb.andWhere('item.characterType = :characterType', { characterType });
    if (search) qb.andWhere('LOWER(item.name) LIKE :search', { search: `%${search.toLowerCase()}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string): Promise<MastersCatalogEntity> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Masters catalog item ${id} not found`);
    return item;
  }
}
