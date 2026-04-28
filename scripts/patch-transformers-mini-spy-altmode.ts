/**
 * Populates the `altMode` field for Mini-Spy G1 Transformers catalog records.
 * The vehicle type is embedded in the figure name (e.g., "Dune Buggy (Blue Autobot)").
 *
 * Run: npm run patch:transformers-mini-spy-altmode
 * Re-run safe: only patches records where altMode is currently null.
 */
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/g1-transformers-catalog.json',
);

interface CatalogEntry {
  name: string;
  subgroup?: string | null;
  altMode?: string | null;
  [key: string]: unknown;
}

function altModeFromName(name: string): string | null {
  if (name.startsWith('Dune Buggy')) return 'Dune buggy';
  if (name.startsWith('FX-1'))       return 'FX-1';
  if (name.startsWith('Jeep'))       return 'Jeep';
  if (name.startsWith('Porsche'))    return 'Porsche';
  return null;
}

function main(): void {
  const records: CatalogEntry[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    if (record.subgroup !== 'Mini-Spy' || record.altMode !== null) {
      skipped++;
      continue;
    }
    const altMode = altModeFromName(record.name);
    if (altMode !== null) {
      record.altMode = altMode;
      updated++;
    } else {
      console.warn(`No altMode match for: ${record.name}`);
      skipped++;
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2), 'utf8');
  console.log(`Done: ${updated} records updated, ${skipped} skipped.`);
}

main();
