import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CollectionsController } from './controllers/collections.controller';
import { MastersController } from './controllers/masters.controller';
import { PhotosController } from './controllers/photos.controller';
import { StarWarsController } from './controllers/star-wars.controller';
import { TransformersController } from './controllers/transformers.controller';
import { G1TransformerEntity } from './entities/g1-transformer.entity';
import { MastersFigureEntity } from './entities/masters-figure.entity';
import { StarWarsFigureEntity } from './entities/star-wars-figure.entity';
import { CollectionsSearchService } from './services/collections-search.service';
import { CollectionsStatsService } from './services/collections-stats.service';
import { MastersService } from './services/masters.service';
import { StarWarsService } from './services/star-wars.service';
import { TransformersService } from './services/transformers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StarWarsFigureEntity, G1TransformerEntity, MastersFigureEntity]),
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
    StarWarsService,
    TransformersService,
    MastersService,
    CollectionsStatsService,
    CollectionsSearchService,
  ],
})
export class CollectionsModule {}
