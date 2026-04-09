/**
 * Seeds the star_wars_catalog table from the committed JSON snapshot.
 *
 * Idempotent: records with an externalId are matched by that field; records
 * without one (9 fallback-source entries) are matched by name + category.
 * Safe to re-run at any time.
 *
 * Run from repo root:
 *   npm run seed:star-wars
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource, IsNull, Not } from 'typeorm';
import { StarWarsCatalogEntity } from '../../modules/collections/entities/star-wars-catalog.entity';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface CatalogJsonRecord {
  externalId: string | null;
  name: string;
  category: string;
  line: string | null;
  figureSize: string | null;
  accessories: string[];
  isVariant: boolean;
  variantDescription: string | null;
  catalogImageUrl: string | null;
  sourceUrl: string | null;
  kennerItemNumber: string | null;
  year: number | null;
}

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(StarWarsCatalogEntity);

  const jsonPath = path.join(__dirname, 'data/star-wars-catalog.json');
  const records: CatalogJsonRecord[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Build dedup sets in two queries — no N+1
  const existingWithId = await repo.find({
    select: { externalId: true },
    where: { externalId: Not(IsNull()) },
  });
  const externalIdSet = new Set(existingWithId.map((r) => r.externalId as string));

  const existingWithoutId = await repo.find({
    select: { name: true, category: true },
    where: { externalId: IsNull() },
  });
  const nameCategSet = new Set(existingWithoutId.map((r) => `${r.name}|${r.category}`));

  const toInsert: Partial<StarWarsCatalogEntity>[] = [];
  let skipped = 0;

  for (const { year: _year, ...record } of records) {
    if (record.externalId !== null) {
      if (externalIdSet.has(record.externalId)) {
        skipped++;
        continue;
      }
    } else {
      if (nameCategSet.has(`${record.name}|${record.category}`)) {
        skipped++;
        continue;
      }
    }
    toInsert.push(record as Partial<StarWarsCatalogEntity>);
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
