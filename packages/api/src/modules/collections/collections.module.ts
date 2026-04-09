import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CollectionsController } from './controllers/collections.controller';
import { MastersController } from './controllers/masters.controller';
import { PhotosController } from './controllers/photos.controller';
import { StarWarsController } from './controllers/star-wars.controller';
import { TransformersController } from './controllers/transformers.controller';
import { G1TransformersCatalogEntity } from './entities/g1-transformers-catalog.entity';
import { MastersCatalogEntity } from './entities/masters-catalog.entity';
import { StarWarsCatalogEntity } from './entities/star-wars-catalog.entity';
import { UserG1TransformersItemEntity } from './entities/user-g1-transformers-item.entity';
import { UserMastersItemEntity } from './entities/user-masters-item.entity';
import { UserStarWarsItemEntity } from './entities/user-star-wars-item.entity';
import { CollectionsSearchService } from './services/collections-search.service';
import { CollectionsStatsService } from './services/collections-stats.service';
import { MastersCatalogService } from './services/masters-catalog.service';
import { StarWarsCatalogService } from './services/star-wars-catalog.service';
import { TransformersService } from './services/transformers.service';
import { UserMastersItemsService } from './services/user-masters-items.service';
import { UserStarWarsItemsService } from './services/user-star-wars-items.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StarWarsCatalogEntity,
      UserStarWarsItemEntity,
      G1TransformersCatalogEntity,
      UserG1TransformersItemEntity,
      MastersCatalogEntity,
      UserMastersItemEntity,
    ]),
    AuthModule, // provides JwtAuthGuard via exported TokenService
  ],
  controllers: [
    CollectionsController,
    StarWarsController,
    TransformersController,
    MastersController,
    PhotosController,
  ],
  providers: [
    StarWarsCatalogService,
    UserStarWarsItemsService,
    TransformersService,
    MastersCatalogService,
    UserMastersItemsService,
    CollectionsStatsService,
    CollectionsSearchService,
  ],
})
export class CollectionsModule {}
