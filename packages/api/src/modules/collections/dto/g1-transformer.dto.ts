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
  TransformersFaction,
  TransformersLine,
  WishlistPriority,
} from '@my-collections/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class G1TransformersCatalogBrowseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by faction', enum: TransformersFaction, enumName: 'TransformersFaction' })
  @IsOptional()
  @IsEnum(TransformersFaction)
  faction?: TransformersFaction;

  @ApiPropertyOptional({ description: 'Filter by series line', enum: TransformersLine, enumName: 'TransformersLine' })
  @IsOptional()
  @IsEnum(TransformersLine)
  line?: TransformersLine;

  @ApiPropertyOptional({ description: 'Search by name (case-insensitive substring)' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateUserG1TransformersItemDto {
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

  @ApiPropertyOptional({ description: 'Packaging/box condition', enum: PackagingCondition, enumName: 'PackagingCondition' })
  @IsOptional()
  @IsEnum(PackagingCondition)
  packagingCondition?: PackagingCondition;

  @ApiPropertyOptional({ description: 'All expected accessories present', example: false })
  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;

  @ApiPropertyOptional({ description: 'Accessories actually in possession', type: [String], example: ['Laser Pistol'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ownedAccessories?: string[];

  @ApiPropertyOptional({ description: 'Item is boxed/packaged', example: false })
  @IsOptional()
  @IsBoolean()
  isBoxed?: boolean;

  @ApiPropertyOptional({ description: 'Instruction booklet included', example: true })
  @IsOptional()
  @IsBoolean()
  hasInstructions?: boolean;

  @ApiPropertyOptional({ description: 'Tech spec card included', example: true })
  @IsOptional()
  @IsBoolean()
  hasTechSpec?: boolean;

  @ApiPropertyOptional({ description: 'Heat-sensitive rub sign present (null = unknown)', example: true })
  @IsOptional()
  @IsBoolean()
  rubSign?: boolean;

  @ApiPropertyOptional({ description: 'Where the item was acquired', enum: AcquisitionSource, enumName: 'AcquisitionSource' })
  @IsOptional()
  @IsEnum(AcquisitionSource)
  acquisitionSource?: AcquisitionSource;

  @ApiPropertyOptional({ description: 'Acquisition date (ISO 8601)', example: '2024-06-15' })
  @IsOptional()
  @IsDateString()
  acquisitionDate?: string;

  @ApiPropertyOptional({ description: 'Purchase price in USD', example: 75.00, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acquisitionPrice?: number;

  @ApiPropertyOptional({ description: 'Estimated current market value in USD', example: 150.00, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ description: 'Free-form notes', example: 'Missing right fist' })
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
export class UpdateUserG1TransformersItemDto extends PartialType(
  OmitType(CreateUserG1TransformersItemDto, ['catalogId'] as const),
) {}

export class MarkG1TransformerAcquiredDto {
  @ApiPropertyOptional({ enum: ConditionGrade, enumName: 'ConditionGrade' })
  @IsOptional()
  @IsEnum(ConditionGrade)
  condition?: ConditionGrade;

  @ApiPropertyOptional({ enum: PackagingCondition, enumName: 'PackagingCondition' })
  @IsOptional()
  @IsEnum(PackagingCondition)
  packagingCondition?: PackagingCondition;

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
