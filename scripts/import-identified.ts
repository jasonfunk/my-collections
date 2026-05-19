/**
 * Imports identified.json into the database as user collection items.
 *
 * Reads the identified.json accumulator built via Claude Desktop sessions,
 * resolves each externalId to a catalog UUID, and upserts a user item record.
 * Already-existing records (same catalogId + userId) are skipped.
 *
 * Usage:
 *   npx ts-node --project packages/api/tsconfig.json scripts/import-identified.ts \
 *     --user collector@example.com [--dry-run]
 *
 * Run from repo root. identified.json must exist at repo root.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.resolve(__dirname, '../packages/api/.env') });

// ---- Entity imports --------------------------------------------------------
// Must match the glob in packages/api/src/data-source.ts
import { User } from '../packages/api/src/modules/auth/entities/user.entity';
import { MastersCatalogEntity } from '../packages/api/src/modules/collections/entities/masters-catalog.entity';
import { UserMastersItemEntity } from '../packages/api/src/modules/collections/entities/user-masters-item.entity';
import { StarWarsCatalogEntity } from '../packages/api/src/modules/collections/entities/star-wars-catalog.entity';
import { UserStarWarsItemEntity } from '../packages/api/src/modules/collections/entities/user-star-wars-item.entity';
import { G1TransformersCatalogEntity } from '../packages/api/src/modules/collections/entities/g1-transformers-catalog.entity';
import { UserG1TransformersItemEntity } from '../packages/api/src/modules/collections/entities/user-g1-transformers-item.entity';

// Additional entities needed to satisfy TypeORM relation resolution
import { OAuthClient } from '../packages/api/src/modules/auth/entities/oauth-client.entity';
import { AuthorizationCode } from '../packages/api/src/modules/auth/entities/authorization-code.entity';
import { RefreshToken } from '../packages/api/src/modules/auth/entities/refresh-token.entity';

// ---- CLI args --------------------------------------------------------------

const args = process.argv.slice(2);
const userFlagIdx = args.indexOf('--user');
if (userFlagIdx === -1 || !args[userFlagIdx + 1]) {
  console.error('Usage: import-identified.ts --user <email> [--dry-run]');
  process.exit(1);
}
const userEmail = args[userFlagIdx + 1];
const dryRun = args.includes('--dry-run');

if (dryRun) console.log('[DRY RUN] No changes will be written to the database.\n');

// ---- identified.json -------------------------------------------------------

interface IdentifiedEntry {
  externalId: string;
  collection: 'HE_MAN' | 'STAR_WARS' | 'TRANSFORMERS';
  name: string;
  isOwned: boolean;
  isComplete: boolean;
  condition: string;
  ownedAccessories: string[];
  notes?: string;
  // He-Man packaging
  isCarded?: boolean;
  hasBackCard?: boolean;
  // Star Wars packaging
  isBoxed?: boolean;
  // Transformers packaging
  hasInstructions?: boolean;
  hasTechSpec?: boolean;
  rubSign?: boolean | null;
}

const IDENTIFIED_PATH = path.resolve(__dirname, '../identified.json');
if (!fs.existsSync(IDENTIFIED_PATH)) {
  console.error(`identified.json not found at ${IDENTIFIED_PATH}`);
  process.exit(1);
}

const identified: Record<string, IdentifiedEntry> = JSON.parse(
  fs.readFileSync(IDENTIFIED_PATH, 'utf-8'),
);
const entries = Object.values(identified);
console.log(`Found ${entries.length} entries in identified.json\n`);

// ---- DataSource ------------------------------------------------------------

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    OAuthClient,
    AuthorizationCode,
    RefreshToken,
    MastersCatalogEntity,
    UserMastersItemEntity,
    StarWarsCatalogEntity,
    UserStarWarsItemEntity,
    G1TransformersCatalogEntity,
    UserG1TransformersItemEntity,
  ],
  synchronize: false,
});

// ---- Import ----------------------------------------------------------------

async function run() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email: userEmail } });
  if (!user) {
    console.error(`User not found: ${userEmail}`);
    await dataSource.destroy();
    process.exit(1);
  }
  console.log(`Importing for user: ${user.email} (${user.id})\n`);

  const mastersCatalogRepo = dataSource.getRepository(MastersCatalogEntity);
  const mastersItemRepo = dataSource.getRepository(UserMastersItemEntity);
  const swCatalogRepo = dataSource.getRepository(StarWarsCatalogEntity);
  const swItemRepo = dataSource.getRepository(UserStarWarsItemEntity);
  const tfCatalogRepo = dataSource.getRepository(G1TransformersCatalogEntity);
  const tfItemRepo = dataSource.getRepository(UserG1TransformersItemEntity);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      if (entry.collection === 'HE_MAN') {
        const catalog = await mastersCatalogRepo.findOne({ where: { externalId: entry.externalId } });
        if (!catalog) { console.warn(`  WARN: catalog not found for He-Man externalId=${entry.externalId} (${entry.name})`); failed++; continue; }
        const existing = await mastersItemRepo.findOne({ where: { catalog: { id: catalog.id }, user: { id: user.id } } });
        if (existing) { console.log(`  SKIP: ${entry.name} (He-Man) already in collection`); skipped++; continue; }
        if (!dryRun) {
          await mastersItemRepo.save({
            catalog,
            user,
            isOwned: true,
            isComplete: entry.isComplete,
            condition: entry.condition as any,
            ownedAccessories: entry.ownedAccessories ?? [],
            isCarded: entry.isCarded ?? false,
            hasBackCard: entry.hasBackCard ?? false,
            notes: entry.notes ?? null,
          });
        }
        console.log(`  ${dryRun ? '[DRY] ' : ''}IMPORT: ${entry.name} (He-Man)`);
        imported++;

      } else if (entry.collection === 'STAR_WARS') {
        // Null externalId means the scraper had no data for this item (common for 12" figures).
        // Fall back to name + figureSize='12' lookup, which is unique in the catalog.
        const catalog = entry.externalId !== null
          ? await swCatalogRepo.findOne({ where: { externalId: entry.externalId } })
          : await swCatalogRepo.findOne({ where: { name: entry.name, figureSize: '12' as any } });
        if (!catalog) { console.warn(`  WARN: catalog not found for Star Wars externalId=${entry.externalId} name="${entry.name}"`); failed++; continue; }
        const existing = await swItemRepo.findOne({ where: { catalog: { id: catalog.id }, user: { id: user.id } } });
        if (existing) { console.log(`  SKIP: ${entry.name} (Star Wars) already in collection`); skipped++; continue; }
        if (!dryRun) {
          await swItemRepo.save({
            catalog,
            user,
            isOwned: true,
            isComplete: entry.isComplete,
            condition: entry.condition as any,
            ownedAccessories: entry.ownedAccessories ?? [],
            isCarded: entry.isCarded ?? false,
            isBoxed: entry.isBoxed ?? false,
            notes: entry.notes ?? null,
          });
        }
        console.log(`  ${dryRun ? '[DRY] ' : ''}IMPORT: ${entry.name} (Star Wars)`);
        imported++;

      } else if (entry.collection === 'TRANSFORMERS') {
        const catalog = await tfCatalogRepo.findOne({ where: { externalId: entry.externalId } });
        if (!catalog) { console.warn(`  WARN: catalog not found for Transformers externalId=${entry.externalId} (${entry.name})`); failed++; continue; }
        const existing = await tfItemRepo.findOne({ where: { catalog: { id: catalog.id }, user: { id: user.id } } });
        if (existing) { console.log(`  SKIP: ${entry.name} (Transformers) already in collection`); skipped++; continue; }
        if (!dryRun) {
          await tfItemRepo.save({
            catalog,
            user,
            isOwned: true,
            isComplete: entry.isComplete,
            condition: entry.condition as any,
            ownedAccessories: entry.ownedAccessories ?? [],
            isBoxed: entry.isBoxed ?? false,
            hasInstructions: entry.hasInstructions ?? false,
            hasTechSpec: entry.hasTechSpec ?? false,
            rubSign: entry.rubSign ?? null,
            notes: entry.notes ?? null,
          });
        }
        console.log(`  ${dryRun ? '[DRY] ' : ''}IMPORT: ${entry.name} (Transformers)`);
        imported++;

      } else {
        console.warn(`  WARN: unknown collection "${(entry as any).collection}" for ${entry.name}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ERROR: ${entry.name} — ${(err as Error).message}`);
      failed++;
    }
  }

  await dataSource.destroy();

  console.log(`\n--- Results ---`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (already existed): ${skipped}`);
  console.log(`Failed: ${failed}`);
  if (dryRun) console.log('\n[DRY RUN] No changes were written.');
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
