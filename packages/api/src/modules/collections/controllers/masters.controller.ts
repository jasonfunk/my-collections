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
import { ConditionGrade, MastersLine } from '@my-collections/shared';
import { AccessTokenPayload } from '../../auth/services/token.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateMastersFigureDto, UpdateMastersFigureDto } from '../dto/masters-figure.dto';
import { MastersService } from '../services/masters.service';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collections/he-man')
export class MastersController {
  constructor(private readonly service: MastersService) {}

  @Get()
  @ApiOperation({ summary: 'List Masters of the Universe figures' })
  @ApiQuery({ name: 'owned', type: Boolean, required: false, description: 'true = owned, false = wishlist' })
  @ApiQuery({ name: 'condition', enum: ConditionGrade, enumName: 'ConditionGrade', required: false })
  @ApiQuery({ name: 'line', enum: MastersLine, enumName: 'MastersLine', required: false })
  findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query('owned') owned?: string,
    @Query('condition') condition?: ConditionGrade,
    @Query('line') line?: MastersLine,
  ) {
    return this.service.findAll(user.sub, {
      owned: owned !== undefined ? owned === 'true' : undefined,
      condition,
      line,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add a Masters of the Universe figure' })
  @ApiResponse({ status: 201, description: 'Figure created' })
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateMastersFigureDto) {
    return this.service.create(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Masters figure by ID' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Masters figure' })
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMastersFigureDto,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a Masters figure' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  remove(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id);
  }
}
