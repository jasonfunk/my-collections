import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

export class BrowseItemsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Case-insensitive name search', example: 'Hordak' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
