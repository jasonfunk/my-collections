/**
 * Seeds the masters_catalog table from the committed JSON snapshot.
 *
 * Idempotent: records are matched by externalId. Safe to re-run at any time.
 *
 * Run from repo root:
 *   npm run seed:he-man
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource, IsNull, Not } from 'typeorm';
import { MastersCatalogEntity } from '../../modules/collections/entities/masters-catalog.entity';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface CatalogJsonRecord {
  externalId: string | null;
  name: string;
  line: string;
  characterType: string | null;
  releaseYear: number | null;
  accessories: string[];
  isVariant: boolean;
  variantDescription: string | null;
  catalogImageUrl: string | null;
  sourceUrl: string | null;
  miniComic: string | null;
  hasArmorOrFeature: boolean;
  featureDescription: string | null;
}

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(MastersCatalogEntity);

  const jsonPath = path.join(__dirname, 'data/he-man-catalog.json');
  const records: CatalogJsonRecord[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Build dedup set — all He-Man items have an externalId from transformerland
  const existingWithId = await repo.find({
    select: { externalId: true },
    where: { externalId: Not(IsNull()) },
  });
  const externalIdSet = new Set(existingWithId.map((r) => r.externalId as string));

  // Fallback dedup by name for any items without externalId
  const existingWithoutId = await repo.find({
    select: { name: true },
    where: { externalId: IsNull() },
  });
  const nameSet = new Set(existingWithoutId.map((r) => r.name));

  const toInsert: Partial<MastersCatalogEntity>[] = [];
  let skipped = 0;

  for (const record of records) {
    if (record.externalId !== null) {
      if (externalIdSet.has(record.externalId)) {
        skipped++;
        continue;
      }
    } else {
      if (nameSet.has(record.name)) {
        skipped++;
        continue;
      }
    }
    toInsert.push(record as Partial<MastersCatalogEntity>);
  }

  console.log(`Inserting ${toInsert.length} records (${skipped} already exist)...`);

  if (toInsert.length > 0) {
    await repo.insert(toInsert);
  }

  await dataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
