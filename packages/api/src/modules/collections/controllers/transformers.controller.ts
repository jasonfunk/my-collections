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
  CreateUserG1TransformersItemDto,
  G1TransformersCatalogBrowseQueryDto,
  MarkG1TransformerAcquiredDto,
  UpdateUserG1TransformersItemDto,
} from '../dto/g1-transformer.dto';
import { G1TransformersCatalogService } from '../services/g1-transformers-catalog.service';
import { UserG1TransformersItemsService } from '../services/user-g1-transformers-items.service';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections/transformers')
export class TransformersController {
  constructor(
    private readonly catalogService: G1TransformersCatalogService,
    private readonly itemsService: UserG1TransformersItemsService,
  ) {}

  // ── Catalog (shared, no userId) ───────────────────────────────────────────

  @Get('catalog')
  @ApiOperation({ summary: 'Browse the G1 Transformers catalog' })
  @ApiResponse({ status: 200, description: 'Paginated catalog items; filter by faction and/or line' })
  browseCatalog(@Query() query: G1TransformersCatalogBrowseQueryDto) {
    return this.catalogService.findAll(query);
  }

  @Get('catalog/:id')
  @ApiOperation({ summary: 'Get a single G1 Transformers catalog item' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getCatalogItem(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  // ── User items (personal records) ────────────────────────────────────────

  @Get('wishlist')
  @ApiOperation({ summary: "List the user's G1 Transformers wishlist (isOwned=false), sorted by priority" })
  listWishlist(
    @CurrentUser() user: AccessTokenPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.itemsService.findWishlist(user.sub, pagination);
  }

  @Get('items')
  @ApiOperation({ summary: "List the user's G1 Transformers personal records (owned + wishlist)" })
  listItems(
    @CurrentUser() user: AccessTokenPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.itemsService.findAll(user.sub, pagination);
  }

  @Post('items')
  @ApiOperation({ summary: 'Claim a G1 Transformers catalog item (add to collection or wishlist)' })
  @ApiResponse({ status: 201, description: 'User record created' })
  @ApiResponse({ status: 409, description: 'Record already exists for this catalog item' })
  createItem(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateUserG1TransformersItemDto) {
    return this.itemsService.create(user.sub, dto);
  }

  @Patch('items/:id/acquired')
  @ApiOperation({ summary: 'Mark a wishlist item as acquired' })
  markAcquired(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: MarkG1TransformerAcquiredDto,
  ) {
    return this.itemsService.markAcquired(user.sub, id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a G1 Transformers personal record' })
  updateItem(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserG1TransformersItemDto,
  ) {
    return this.itemsService.update(user.sub, id, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a G1 Transformers personal record' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  removeItem(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.itemsService.remove(user.sub, id);
  }
}
