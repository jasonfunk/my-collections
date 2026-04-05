import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { CardbackStyle, FigureSize, StarWarsLine } from '@my-collections/shared';
import { CreateBaseItemDto } from './base-item.dto';

export class CreateStarWarsFigureDto extends CreateBaseItemDto {
  @ApiProperty({ description: 'Item name', example: 'Luke Skywalker (X-Wing Pilot)' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Kenner product line', enum: StarWarsLine, enumName: 'StarWarsLine' })
  @IsEnum(StarWarsLine)
  line!: StarWarsLine;

  @ApiProperty({ description: 'Figure size', enum: FigureSize, enumName: 'FigureSize' })
  @IsEnum(FigureSize)
  figureSize!: FigureSize;

  @ApiProperty({ description: 'Is this a known variant?', example: false })
  @IsBoolean()
  isVariant!: boolean;

  @ApiPropertyOptional({ description: 'Variant description', example: 'Double telescoping lightsaber' })
  @IsOptional()
  @IsString()
  variantDescription?: string;

  @ApiPropertyOptional({ description: 'Cardback style (if carded)', enum: CardbackStyle, enumName: 'CardbackStyle' })
  @IsOptional()
  @IsEnum(CardbackStyle)
  cardbackStyle?: CardbackStyle;

  @ApiProperty({ description: 'Still on original card', example: false })
  @IsBoolean()
  isCarded!: boolean;

  @ApiPropertyOptional({ description: 'Full accessory list for this figure', type: [String], example: ['Lightsaber', 'Belt'] })
  @IsOptional()
  @IsString({ each: true })
  accessories?: string[];

  @ApiPropertyOptional({ description: 'Accessories actually in possession', type: [String], example: ['Lightsaber'] })
  @IsOptional()
  @IsString({ each: true })
  ownedAccessories?: string[];

  @ApiPropertyOptional({ description: 'POTF coin included', example: true })
  @IsOptional()
  @IsBoolean()
  coinIncluded?: boolean;

  @ApiPropertyOptional({ description: 'Kenner catalog item number', example: '38180' })
  @IsOptional()
  @IsString()
  kennerItemNumber?: string;
}

export class UpdateStarWarsFigureDto extends PartialType(CreateStarWarsFigureDto) {}
