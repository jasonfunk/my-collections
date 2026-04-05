import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { TransformerSize, TransformersFaction, TransformersLine } from '@my-collections/shared';
import { CreateBaseItemDto } from './base-item.dto';

export class CreateG1TransformerDto extends CreateBaseItemDto {
  @ApiProperty({ description: 'Item name', example: 'Optimus Prime' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Autobot or Decepticon', enum: TransformersFaction, enumName: 'TransformersFaction' })
  @IsEnum(TransformersFaction)
  faction!: TransformersFaction;

  @ApiProperty({ description: 'G1 series', enum: TransformersLine, enumName: 'TransformersLine' })
  @IsEnum(TransformersLine)
  line!: TransformersLine;

  @ApiProperty({ description: 'Figure size class', enum: TransformerSize, enumName: 'TransformerSize' })
  @IsEnum(TransformerSize)
  size!: TransformerSize;

  @ApiProperty({ description: 'Alternate mode description', example: 'Porsche 911 Turbo' })
  @IsString()
  altMode!: string;

  @ApiPropertyOptional({ description: 'Full accessory list', type: [String], example: ['Rifle', 'Launcher'] })
  @IsOptional()
  @IsString({ each: true })
  accessories?: string[];

  @ApiPropertyOptional({ description: 'Accessories in possession', type: [String], example: ['Rifle'] })
  @IsOptional()
  @IsString({ each: true })
  ownedAccessories?: string[];

  @ApiProperty({ description: 'Still in original box', example: false })
  @IsBoolean()
  isBoxed!: boolean;

  @ApiProperty({ description: 'Instructions sheet included', example: true })
  @IsBoolean()
  hasInstructions!: boolean;

  @ApiProperty({ description: 'Tech spec card included', example: true })
  @IsBoolean()
  hasTechSpec!: boolean;

  @ApiProperty({ description: 'Is a combiner component', example: false })
  @IsBoolean()
  isCombiner!: boolean;

  @ApiPropertyOptional({ description: 'Combiner team name', example: 'Aerialbots' })
  @IsOptional()
  @IsString()
  combinerTeam?: string;

  @ApiPropertyOptional({ description: 'Is a gift set release', example: false })
  @IsOptional()
  @IsBoolean()
  isGiftSet?: boolean;

  @ApiPropertyOptional({ description: 'Is a mail-away exclusive', example: false })
  @IsOptional()
  @IsBoolean()
  isMailaway?: boolean;

  @ApiPropertyOptional({ description: 'Is Japanese Takara release', example: false })
  @IsOptional()
  @IsBoolean()
  japaneseRelease?: boolean;

  @ApiPropertyOptional({ description: 'Heat-sensitive rub sign present', example: true })
  @IsOptional()
  @IsBoolean()
  rubSign?: boolean;
}

export class UpdateG1TransformerDto extends PartialType(CreateG1TransformerDto) {}
