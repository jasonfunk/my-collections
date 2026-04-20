import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenPayload } from '../../auth/services/token.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CollectionSearchQueryDto } from '../dto/collection-search-query.dto';
import { CollectionsSearchService } from '../services/collections-search.service';
import { CollectionsStatsService } from '../services/collections-stats.service';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly statsService: CollectionsStatsService,
    private readonly searchService: CollectionsSearchService,
  ) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Collection summary statistics',
    description: 'Returns owned/wishlist counts and estimated total values across all collection types.',
  })
  getStats(@CurrentUser() user: AccessTokenPayload) {
    return this.statsService.getStats(user.sub);
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Recently added items across all collections',
    description: 'Returns the most recently added user items across Star Wars, Transformers, and He-Man, sorted by creation date.',
  })
  getRecent(
    @CurrentUser() user: AccessTokenPayload,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.statsService.getRecentItems(user.sub, Math.min(limit, 20));
  }

  @Get('search')
  @ApiOperation({
    summary: 'Global search across all collections',
    description: 'Search by name/notes across Star Wars, Transformers, and He-Man. Filter by collection type, condition, owned/wishlist, and completeness.',
  })
  search(@Query() query: CollectionSearchQueryDto, @CurrentUser() user: AccessTokenPayload) {
    return this.searchService.search(user.sub, query);
  }
}
