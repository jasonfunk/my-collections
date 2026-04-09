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
  MastersCharacterType,
  MastersLine,
  PackagingCondition,
  WishlistPriority,
} from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class MastersCatalogBrowseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by product line', enum: MastersLine, enumName: 'MastersLine' })
  @IsOptional()
  @IsEnum(MastersLine)
  line?: MastersLine;

  @ApiPropertyOptional({ description: 'Filter by character type', enum: MastersCharacterType, enumName: 'MastersCharacterType' })
  @IsOptional()
  @IsEnum(MastersCharacterType)
  characterType?: MastersCharacterType;

  @ApiPropertyOptional({ description: 'Search by name (case-insensitive substring)' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateUserMastersItemDto {
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

  @ApiPropertyOptional({ description: 'Accessories actually in possession', type: [String], example: ['Power Sword'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownedAccessories?: string[];

  @ApiPropertyOptional({ description: 'Still on original card', example: false })
  @IsOptional()
  @IsBoolean()
  isCarded?: boolean;

  @ApiPropertyOptional({ description: 'Back card (mini-comic side) intact', example: false })
  @IsOptional()
  @IsBoolean()
  hasBackCard?: boolean;

  @ApiPropertyOptional({ description: 'Where the item was acquired', enum: AcquisitionSource, enumName: 'AcquisitionSource' })
  @IsOptional()
  @IsEnum(AcquisitionSource)
  acquisitionSource?: AcquisitionSource;

  @ApiPropertyOptional({ description: 'Acquisition date (ISO 8601)', example: '2024-06-15' })
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;

  @ApiPropertyOptional({ description: 'Purchase price in USD', example: 35.00, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acquisitionPrice?: number;

  @ApiPropertyOptional({ description: 'Estimated current market value in USD', example: 90.00, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'Free-form notes', example: 'Missing Power Sword' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Your own photo URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

// catalogId cannot be changed after creation
export class UpdateUserMastersItemDto extends PartialType(
  OmitType(CreateUserMastersItemDto, ['catalogId'] as const),
) {}

export class MarkMastersAcquiredDto {
  @ApiPropertyOptional({ enum: ConditionGrade, enumName: 'ConditionGrade' })
  @IsOptional()
  @IsEnum(ConditionGrade)
  condition?: ConditionGrade;

  @ApiPropertyOptional({ enum: AcquisitionSource, enumName: 'AcquisitionSource' })
  @IsOptional()
  @IsEnum(AcquisitionSource)
  acquisitionSource?: AcquisitionSource;

  @ApiPropertyOptional({ example: '2025-04-09' })
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
