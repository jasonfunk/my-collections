import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  AcquisitionSource,
  ConditionGrade,
  PackagingCondition,
} from '@my-collections/shared';

/**
 * Shared fields for all collection item Create DTOs.
 * Per-type DTOs extend this and add their specific fields.
 *
 * Note: collectionType is NOT included — it is set by the service
 * based on which endpoint was called. Clients cannot override it.
 */
export class CreateBaseItemDto {
  @ApiProperty({ description: 'Item name', example: 'Luke Skywalker (X-Wing Pilot)' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Item condition grade', enum: ConditionGrade, enumName: 'ConditionGrade' })
  @IsEnum(ConditionGrade)
  condition!: ConditionGrade;

  @ApiProperty({ description: 'Packaging condition', enum: PackagingCondition, enumName: 'PackagingCondition' })
  @IsEnum(PackagingCondition)
  packagingCondition!: PackagingCondition;

  @ApiProperty({ description: 'true = owned, false = wishlist', example: true })
  @IsBoolean()
  isOwned!: boolean;

  @ApiProperty({ description: 'All accessories/parts present', example: false })
  @IsBoolean()
  isComplete!: boolean;

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

  @ApiPropertyOptional({ description: 'Free-form notes', example: 'Slight discoloration on left arm' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Photo URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
