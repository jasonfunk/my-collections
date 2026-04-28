/**
 * Seeds the g1_transformers_catalog table from the committed JSON snapshot.
 *
 * Idempotent: records are matched by externalId. Safe to re-run at any time.
 *
 * Run from repo root:
 *   npm run seed:transformers              # insert new records only
 *   npm run seed:transformers -- --update  # also update all nullable fields on existing rows
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource, IsNull, Not } from 'typeorm';
import { G1TransformersCatalogEntity } from '../../modules/collections/entities/g1-transformers-catalog.entity';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const updateMode = process.argv.includes('--update');

interface CatalogJsonRecord {
  externalId: string | null;
  name: string;
  faction: string | null;
  line: string | null;
  altMode: string | null;
  subgroup: string | null;
  size: string | null;
  accessories: string[];
  releaseYear: number | null;
  isVariant: boolean;
  variantDescription: string | null;
  catalogImageUrl: string | null;
  sourceUrl: string | null;
  isCombiner: boolean;
  combinerTeam: string | null;
  isGiftSet: boolean;
  isMailaway: boolean;
  japaneseRelease: boolean;
}

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(G1TransformersCatalogEntity);

  const jsonPath = path.join(__dirname, 'data/g1-transformers-catalog.json');
  const records: CatalogJsonRecord[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  if (updateMode) {
    console.log('Running in --update mode (updating existing rows + inserting new ones)...');
    let updated = 0;
    let inserted = 0;

    for (const record of records) {
      const entityData = record as Partial<G1TransformersCatalogEntity>;

      if (record.externalId !== null) {
        const result = await repo.update({ externalId: record.externalId }, entityData);
        if ((result.affected ?? 0) > 0) {
          updated++;
        } else {
          await repo.insert(entityData);
          inserted++;
        }
      } else {
        const result = await repo.update({ name: record.name }, entityData);
        if ((result.affected ?? 0) > 0) {
          updated++;
        } else {
          await repo.insert(entityData);
          inserted++;
        }
      }
    }

    console.log(`Done: ${updated} updated, ${inserted} inserted.`);
  } else {
    // Build dedup set — match by externalId (transformerland item ID)
    const existingWithId = await repo.find({
      select: { externalId: true },
      where: { externalId: Not(IsNull()) },
    });
    const externalIdSet = new Set(existingWithId.map((r) => r.externalId as string));

    const existingWithoutId = await repo.find({
      select: { name: true },
      where: { externalId: IsNull() },
    });
    const nameSet = new Set(existingWithoutId.map((r) => r.name));

    const toInsert: Partial<G1TransformersCatalogEntity>[] = [];
    let skipped = 0;

    for (const record of records) {
      if (record.externalId !== null) {
        if (externalIdSet.has(record.externalId)) { skipped++; continue; }
      } else {
        if (nameSet.has(record.name)) { skipped++; continue; }
      }
      toInsert.push(record as Partial<G1TransformersCatalogEntity>);
    }

    console.log(`Inserting ${toInsert.length} records (${skipped} already exist)...`);
    if (toInsert.length > 0) {
      await repo.insert(toInsert);
    }
    console.log('Seed complete.');
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
