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
import { ConditionGrade, StarWarsLine } from '@my-collections/shared';
import { AccessTokenPayload } from '../../auth/services/token.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateStarWarsFigureDto, UpdateStarWarsFigureDto } from '../dto/star-wars-figure.dto';
import { StarWarsService } from '../services/star-wars.service';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections/star-wars')
export class StarWarsController {
  constructor(private readonly service: StarWarsService) {}

  @Get()
  @ApiOperation({ summary: 'List Star Wars figures' })
  @ApiQuery({ name: 'owned', type: Boolean, required: false, description: 'true = owned, false = wishlist' })
  @ApiQuery({ name: 'condition', enum: ConditionGrade, enumName: 'ConditionGrade', required: false })
  @ApiQuery({ name: 'line', enum: StarWarsLine, enumName: 'StarWarsLine', required: false })
  findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query('owned') owned?: string,
    @Query('condition') condition?: ConditionGrade,
    @Query('line') line?: StarWarsLine,
  ) {
    return this.service.findAll(user.sub, {
      owned: owned !== undefined ? owned === 'true' : undefined,
      condition,
      line,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add a Star Wars figure' })
  @ApiResponse({ status: 201, description: 'Figure created' })
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateStarWarsFigureDto) {
    return this.service.create(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Star Wars figure by ID' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Star Wars figure' })
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStarWarsFigureDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a Star Wars figure' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id);
  }
}
