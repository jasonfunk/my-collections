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
  CreateUserMastersItemDto,
  MarkMastersAcquiredDto,
  MastersCatalogBrowseQueryDto,
  UpdateUserMastersItemDto,
} from '../dto/masters-catalog.dto';
import { MastersCatalogService } from '../services/masters-catalog.service';
import { UserMastersItemsService } from '../services/user-masters-items.service';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections/he-man')
export class MastersController {
  constructor(
    private readonly catalogService: MastersCatalogService,
    private readonly itemsService: UserMastersItemsService,
  ) {}

  // ── Catalog (shared, no userId) ───────────────────────────────────────────

  @Get('catalog')
  @ApiOperation({ summary: 'Browse the Masters of the Universe catalog' })
  @ApiResponse({ status: 200, description: 'Paginated catalog items; filter by line and/or characterType' })
  browseCatalog(@Query() query: MastersCatalogBrowseQueryDto) {
    return this.catalogService.findAll(query);
  }

  @Get('catalog/:id')
  @ApiOperation({ summary: 'Get a single Masters catalog item' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getCatalogItem(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  // ── User items (personal records) ────────────────────────────────────────

  @Get('wishlist')
  @ApiOperation({ summary: "List the user's He-Man wishlist (isOwned=false), sorted by priority" })
  listWishlist(
    @CurrentUser() user: AccessTokenPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.itemsService.findWishlist(user.sub, pagination);
  }

  @Get('items')
  @ApiOperation({ summary: "List the user's He-Man personal records (owned + wishlist)" })
  listItems(
    @CurrentUser() user: AccessTokenPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.itemsService.findAll(user.sub, pagination);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a single He-Man item by ID' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getItem(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    return this.itemsService.findOne(user.sub, id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Claim a Masters catalog item (add to collection or wishlist)' })
  @ApiResponse({ status: 201, description: 'User record created' })
  @ApiResponse({ status: 409, description: 'Record already exists for this catalog item' })
  createItem(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateUserMastersItemDto) {
    return this.itemsService.create(user.sub, dto);
  }

  @Patch('items/:id/acquired')
  @ApiOperation({ summary: 'Mark a wishlist item as acquired' })
  markAcquired(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: MarkMastersAcquiredDto,
  ) {
    return this.itemsService.markAcquired(user.sub, id, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a Masters personal record' })
  updateItem(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserMastersItemDto,
  ) {
    return this.itemsService.update(user.sub, id, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a Masters personal record' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  removeItem(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.itemsService.remove(user.sub, id);
  }
}
