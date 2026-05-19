/**
 * Exports lean, identification-focused versions of the three collection catalogs
 * to docs/identification/ for use as Claude Desktop project knowledge.
 *
 * Strips fields irrelevant to visual identification (catalogImageUrl, sourceUrl)
 * and drops null/false-only fields to keep the JSON compact.
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/export-identification-catalogs.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const SEED_DIR = path.resolve(__dirname, '../packages/api/src/database/seeds/data');
const OUT_DIR = path.resolve(__dirname, '../docs/identification');

// ---- He-Man ----------------------------------------------------------------

interface RawMastersItem {
  externalId: string;
  name: string;
  line?: string | null;
  characterType?: string | null;
  releaseYear?: number | null;
  accessories: string[];
  isVariant: boolean;
  variantDescription?: string | null;
  hasArmorOrFeature: boolean;
  featureDescription?: string | null;
  miniComic?: string | null;
}

function mapMasters(item: RawMastersItem): Record<string, unknown> {
  const out: Record<string, unknown> = { externalId: item.externalId, name: item.name };
  if (item.line) out.line = item.line;
  if (item.characterType) out.characterType = item.characterType;
  if (item.releaseYear) out.releaseYear = item.releaseYear;
  if (item.accessories?.length) out.accessories = item.accessories;
  if (item.isVariant) out.isVariant = true;
  if (item.variantDescription) out.variantDescription = item.variantDescription;
  if (item.hasArmorOrFeature) out.hasArmorOrFeature = true;
  if (item.featureDescription) out.featureDescription = item.featureDescription;
  if (item.miniComic) out.miniComic = item.miniComic;
  return out;
}

// ---- Star Wars -------------------------------------------------------------

interface RawStarWarsItem {
  externalId: string;
  name: string;
  category?: string | null;
  line?: string | null;
  figureSize?: string | null;
  releaseYear?: number | null;
  year?: number | null;
  accessories: string[];
  isVariant: boolean;
  variantDescription?: string | null;
  kennerItemNumber?: string | null;
  coinIncluded?: boolean | null;
}

function mapStarWars(item: RawStarWarsItem): Record<string, unknown> {
  const out: Record<string, unknown> = { externalId: item.externalId, name: item.name };
  if (item.category) out.category = item.category;
  if (item.line) out.line = item.line;
  if (item.figureSize) out.figureSize = item.figureSize;
  const year = item.releaseYear ?? item.year;
  if (year) out.releaseYear = year;
  if (item.accessories?.length) out.accessories = item.accessories;
  if (item.isVariant) out.isVariant = true;
  if (item.variantDescription) out.variantDescription = item.variantDescription;
  if (item.kennerItemNumber) out.kennerItemNumber = item.kennerItemNumber;
  if (item.coinIncluded) out.coinIncluded = true;
  return out;
}

// ---- Transformers ----------------------------------------------------------

interface RawTransformersItem {
  externalId: string;
  name: string;
  faction?: string | null;
  line?: string | null;
  size?: string | null;
  altMode?: string | null;
  subgroup?: string | null;
  releaseYear?: number | null;
  accessories: string[];
  isVariant: boolean;
  variantDescription?: string | null;
  isCombiner: boolean;
  combinerTeam?: string | null;
  isGiftSet: boolean;
  isMailaway: boolean;
  japaneseRelease: boolean;
}

function mapTransformers(item: RawTransformersItem): Record<string, unknown> {
  const out: Record<string, unknown> = { externalId: item.externalId, name: item.name };
  if (item.faction) out.faction = item.faction;
  if (item.line) out.line = item.line;
  if (item.size) out.size = item.size;
  if (item.altMode) out.altMode = item.altMode;
  if (item.subgroup) out.subgroup = item.subgroup;
  if (item.releaseYear) out.releaseYear = item.releaseYear;
  if (item.accessories?.length) out.accessories = item.accessories;
  if (item.isVariant) out.isVariant = true;
  if (item.variantDescription) out.variantDescription = item.variantDescription;
  if (item.isCombiner) out.isCombiner = true;
  if (item.combinerTeam) out.combinerTeam = item.combinerTeam;
  if (item.isGiftSet) out.isGiftSet = true;
  if (item.isMailaway) out.isMailaway = true;
  if (item.japaneseRelease) out.japaneseRelease = true;
  return out;
}

// ---- Main ------------------------------------------------------------------

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const mastersRaw: RawMastersItem[] = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, 'he-man-catalog.json'), 'utf-8'),
  );
  const starWarsRaw: RawStarWarsItem[] = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, 'star-wars-catalog.json'), 'utf-8'),
  );
  const transformersRaw: RawTransformersItem[] = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, 'g1-transformers-catalog.json'), 'utf-8'),
  );

  const masters = mastersRaw.map(mapMasters);
  const starWars = starWarsRaw.map(mapStarWars);
  const transformers = transformersRaw.map(mapTransformers);

  fs.writeFileSync(path.join(OUT_DIR, 'he-man-catalog.json'), JSON.stringify(masters, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'star-wars-catalog.json'), JSON.stringify(starWars, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'transformers-catalog.json'), JSON.stringify(transformers, null, 2));

  console.log(`He-Man:       ${masters.length} items → docs/identification/he-man-catalog.json`);
  console.log(`Star Wars:    ${starWars.length} items → docs/identification/star-wars-catalog.json`);
  console.log(`Transformers: ${transformers.length} items → docs/identification/transformers-catalog.json`);
}

run();
