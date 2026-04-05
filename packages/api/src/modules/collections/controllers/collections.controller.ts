import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenPayload } from '../../auth/services/token.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CollectionsStatsService } from '../services/collections-stats.service';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly statsService: CollectionsStatsService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Collection summary statistics',
    description: 'Returns owned/wishlist counts and estimated total values across all collection types.',
  })
  getStats(@CurrentUser() user: AccessTokenPayload) {
    return this.statsService.getStats(user.sub);
  }
}
