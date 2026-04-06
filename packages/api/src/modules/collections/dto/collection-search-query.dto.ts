import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { CollectionType, ConditionGrade } from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CollectionSearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search on name and notes (case-insensitive)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: CollectionType, enumName: 'CollectionType', description: 'Filter by collection type' })
  @IsOptional()
  @IsEnum(CollectionType)
  collectionType?: CollectionType;

  @ApiPropertyOptional({ enum: ConditionGrade, enumName: 'ConditionGrade' })
  @IsOptional()
  @IsEnum(ConditionGrade)
  condition?: ConditionGrade;

  @ApiPropertyOptional({ type: Boolean, description: 'true = owned, false = wishlist' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  @IsBoolean()
  isOwned?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  @IsBoolean()
  isComplete?: boolean;
}
