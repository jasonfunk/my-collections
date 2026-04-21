import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AccessTokenPayload } from '../../auth/services/token.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CatalogBrowseQueryDto,
  CreateUserStarWarsItemDto,
  MarkAcquiredDto,
  UpdateUserStarWarsItemDto,
} from '../dto/star-wars-catalog.dto';
import { StarWarsCatalogService } from '../services/star-wars-catalog.service';
import { UserStarWarsItemsService } from '../services/user-star-wars-items.service';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections/star-wars')
export class StarWarsController {
  constructor(
    private readonly catalogService: StarWarsCatalogService,
    private readonly itemsService: UserStarWarsItemsService,
  ) {}

  // ── Catalog (shared, no userId) ───────────────────────────────────────────

  @Get('catalog')
  @ApiOperation({ summary: 'Browse the Star Wars catalog' })
  @ApiResponse({ status: 200, description: 'Paginated catalog items; filter by category and/or line' })
  browseCatalog(@Query() query: CatalogBrowseQueryDto) {
    return this.catalogService.findAll(query);
  }

  @Get('catalog/:id')
  @ApiOperation({ summary: 'Get a single Star Wars catalog item' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getCatalogItem(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  // ── User items (personal records) ────────────────────────────────────────

  @Get('wishlist')
  @ApiOperation({ summary: "List the user's Star Wars wishlist (isOwned=false), sorted by priority" })
  listWishlist(
    @CurrentUser() user: AccessTokenPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.itemsService.findWishlist(user.sub, pagination);
  }

  @Get('items')
  @ApiOperation({ summary: "List the user's Star Wars records (owned + wishlist)" })
  listItems(
    @CurrentUser() user: AccessTokenPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.itemsService.findAll(user.sub, pagination);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a single Star Wars item by ID' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getItem(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    return this.itemsService.findOne(user.sub, id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Claim a catalog item (mark as owned or add to wishlist)' })
  @ApiResponse({ status: 201, description: 'Record created' })
  @ApiResponse({ status: 404, description: 'Catalog item not found' })
  @ApiResponse({ status: 409, description: 'Record already exists for this catalog item' })
  claimItem(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateUserStarWarsItemDto,
  ) {
    return this.itemsService.create(user.sub, dto);
  }

  @Patch('items/:id/acquired')
  @ApiOperation({ summary: 'Mark a Star Wars wishlist item as acquired (sets isOwned=true)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  markAcquired(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: MarkAcquiredDto,
  ) {
    return this.itemsService.markAcquired(user.sub, id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a personal Star Wars record' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateItem(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserStarWarsItemDto,
  ) {
    return this.itemsService.update(user.sub, id, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a personal Star Wars record' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  removeItem(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    return this.itemsService.remove(user.sub, id);
  }
}
