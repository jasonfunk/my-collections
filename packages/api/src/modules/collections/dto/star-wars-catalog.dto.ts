import { OmitType, PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  AcquisitionSource,
  ConditionGrade,
  PackagingCondition,
  StarWarsCategory,
  StarWarsLine,
  WishlistPriority,
} from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CatalogBrowseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by item category', enum: StarWarsCategory, enumName: 'StarWarsCategory' })
  @IsOptional()
  @IsEnum(StarWarsCategory)
  category?: StarWarsCategory;

  @ApiPropertyOptional({ description: 'Filter by Kenner product line', enum: StarWarsLine, enumName: 'StarWarsLine' })
  @IsOptional()
  @IsEnum(StarWarsLine)
  line?: StarWarsLine;
}

export class CreateUserStarWarsItemDto {
  @ApiProperty({ description: 'Catalog item ID to claim', example: 'uuid-here' })
  @IsUUID()
  catalogId!: string;

  @ApiProperty({ description: 'true = owned, false = wishlist', example: false })
  @IsBoolean()
  isOwned!: boolean;

  @ApiPropertyOptional({ description: 'Wishlist priority (meaningful only when not owned)', enum: WishlistPriority, enumName: 'WishlistPriority' })
  @IsOptional()
  @IsEnum(WishlistPriority)
  wishlistPriority?: WishlistPriority;

  @ApiPropertyOptional({ description: 'Item condition grade', enum: ConditionGrade, enumName: 'ConditionGrade' })
  @IsOptional()
  @IsEnum(ConditionGrade)
  condition?: ConditionGrade;

  @ApiPropertyOptional({ description: 'Packaging condition', enum: PackagingCondition, enumName: 'PackagingCondition' })
  @IsOptional()
  @IsEnum(PackagingCondition)
  packagingCondition?: PackagingCondition;

  @ApiPropertyOptional({ description: 'All expected accessories present', example: false })
  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;

  @ApiPropertyOptional({ description: 'Accessories actually in possession', type: [String], example: ['Lightsaber'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownedAccessories?: string[];

  @ApiPropertyOptional({ description: 'Still on original card', example: false })
  @IsOptional()
  @IsBoolean()
  isCarded?: boolean;

  @ApiPropertyOptional({ description: 'Still in original box (vehicles/playsets)', example: false })
  @IsOptional()
  @IsBoolean()
  isBoxed?: boolean;

  @ApiPropertyOptional({ description: 'Where the item was acquired', enum: AcquisitionSource, enumName: 'AcquisitionSource' })
  @IsOptional()
  @IsEnum(AcquisitionSource)
  acquisitionSource?: AcquisitionSource;

  @ApiPropertyOptional({ description: 'Acquisition date (ISO 8601)', example: '2024-06-15' })
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;

  @ApiPropertyOptional({ description: 'Purchase price in USD', example: 45.00, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acquisitionPrice?: number;

  @ApiPropertyOptional({ description: 'Estimated current market value in USD', example: 120.00, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'Free-form notes', example: 'Slight discoloration on helmet' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Your own photo URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

// catalogId cannot be changed after creation — the user record is permanently linked to one catalog item
export class UpdateUserStarWarsItemDto extends PartialType(
  OmitType(CreateUserStarWarsItemDto, ['catalogId'] as const),
) {}

export class MarkAcquiredDto {
  @ApiPropertyOptional({ enum: ConditionGrade, enumName: 'ConditionGrade' })
  @IsOptional()
  @IsEnum(ConditionGrade)
  condition?: ConditionGrade;

  @ApiPropertyOptional({ enum: AcquisitionSource, enumName: 'AcquisitionSource' })
  @IsOptional()
  @IsEnum(AcquisitionSource)
  acquisitionSource?: AcquisitionSource;

  @ApiPropertyOptional({ example: '2025-04-08' })
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acquisitionPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
