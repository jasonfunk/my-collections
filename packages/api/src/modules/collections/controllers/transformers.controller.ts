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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AcquisitionSource, ConditionGrade, TransformersFaction, TransformersLine } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AccessTokenPayload } from '../../auth/services/token.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateG1TransformerDto, UpdateG1TransformerDto } from '../dto/g1-transformer.dto';
import { TransformersService } from '../services/transformers.service';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections/transformers')
export class TransformersController {
  constructor(private readonly service: TransformersService) {}

  @Get()
  @ApiOperation({ summary: 'List G1 Transformers' })
  @ApiQuery({ name: 'owned', type: Boolean, required: false, description: 'true = owned, false = wishlist' })
  @ApiQuery({ name: 'condition', enum: ConditionGrade, enumName: 'ConditionGrade', required: false })
  @ApiQuery({ name: 'faction', enum: TransformersFaction, enumName: 'TransformersFaction', required: false })
  @ApiQuery({ name: 'line', enum: TransformersLine, enumName: 'TransformersLine', required: false })
  @ApiQuery({ name: 'acquisitionSource', enum: AcquisitionSource, enumName: 'AcquisitionSource', required: false })
  @ApiQuery({ name: 'isComplete', type: Boolean, required: false })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Search name and notes (case-insensitive)' })
  findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query() pagination: PaginationQueryDto,
    @Query('owned') owned?: string,
    @Query('condition') condition?: ConditionGrade,
    @Query('faction') faction?: TransformersFaction,
    @Query('line') line?: TransformersLine,
    @Query('acquisitionSource') acquisitionSource?: AcquisitionSource,
    @Query('isComplete') isComplete?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(
      user.sub,
      {
        owned: owned !== undefined ? owned === 'true' : undefined,
        condition,
        faction,
        line,
        acquisitionSource,
        isComplete: isComplete !== undefined ? isComplete === 'true' : undefined,
        search: search || undefined,
      },
      pagination,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Add a G1 Transformer' })
  @ApiResponse({ status: 201, description: 'Transformer created' })
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateG1TransformerDto) {
    return this.service.create(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a G1 Transformer by ID' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a G1 Transformer' })
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateG1TransformerDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a G1 Transformer' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id);
  }
}
