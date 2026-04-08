import { Injectable } from '@nestjs/common';
import { PaginatedResponse } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// TODO: implement when Masters scraper lands (COL-xx)
// The masters_figures table was replaced by masters_catalog + user_masters_items in COL-63.
// Full service implementation follows the same pattern as UserStarWarsItemsService / StarWarsCatalogService.

@Injectable()
export class MastersService {
  findAll(_userId: string, _filters: unknown, pagination: PaginationQueryDto): Promise<PaginatedResponse<never>> {
    const { page = 1, limit = 20 } = pagination;
    return Promise.resolve({ data: [], meta: { page, limit, total: 0, totalPages: 0 } });
  }

  findOne(_userId: string, _id: string): Promise<never> {
    return Promise.reject(new Error('Not implemented'));
  }

  create(_userId: string, _dto: unknown): Promise<never> {
    return Promise.reject(new Error('Not implemented'));
  }

  update(_userId: string, _id: string, _dto: unknown): Promise<never> {
    return Promise.reject(new Error('Not implemented'));
  }

  remove(_userId: string, _id: string): Promise<void> {
    return Promise.resolve();
  }
}
