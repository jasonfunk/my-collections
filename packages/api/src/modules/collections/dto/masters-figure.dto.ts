import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MastersCharacterType, MastersLine } from '@my-collections/shared';
import { CreateBaseItemDto } from './base-item.dto';

export class CreateMastersFigureDto extends CreateBaseItemDto {
  @ApiProperty({ description: 'Masters of the Universe line', enum: MastersLine, enumName: 'MastersLine' })
  @IsEnum(MastersLine)
  line!: MastersLine;

  @ApiProperty({ description: 'Character alignment/type', enum: MastersCharacterType, enumName: 'MastersCharacterType' })
  @IsEnum(MastersCharacterType)
  characterType!: MastersCharacterType;

  @ApiPropertyOptional({ description: 'Year the figure was released', example: 1982, minimum: 1981, maximum: 1990 })
  @IsOptional()
  @IsInt()
  @Min(1981)
  @Max(1990)
  releaseYear?: number;

  @ApiProperty({ description: 'Is this a known variant?', example: false })
  @IsBoolean()
  isVariant!: boolean;

  @ApiPropertyOptional({ description: 'Variant description', example: 'First release, cross sell back' })
  @IsOptional()
  @IsString()
  variantDescription?: string;

  @ApiPropertyOptional({ description: 'Full accessory list', type: [String], example: ['Sword', 'Shield', 'Armor'] })
  @IsOptional()
  @IsString({ each: true })
  accessories?: string[];

  @ApiPropertyOptional({ description: 'Accessories in possession', type: [String], example: ['Sword'] })
  @IsOptional()
  @IsString({ each: true })
  ownedAccessories?: string[];

  @ApiProperty({ description: 'Still on original card', example: false })
  @IsBoolean()
  isCarded!: boolean;

  @ApiProperty({ description: 'Back card / mini-comic intact', example: true })
  @IsBoolean()
  hasBackCard!: boolean;

  @ApiPropertyOptional({ description: 'Title of included mini comic', example: 'He-Man and the Power Sword' })
  @IsOptional()
  @IsString()
  miniComic?: string;

  @ApiProperty({ description: 'Has action feature or battle armor', example: false })
  @IsBoolean()
  hasArmorOrFeature!: boolean;

  @ApiPropertyOptional({ description: 'Description of armor or feature', example: 'Battle Armor' })
  @IsOptional()
  @IsString()
  featureDescription?: string;
}

export class UpdateMastersFigureDto extends PartialType(CreateMastersFigureDto) {}
