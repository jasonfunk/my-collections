/**
 * COL-100: Derives StarWarsLine from the `year` field already present in the JSON,
 * sets coinIncluded=true for all POWER_OF_THE_FORCE items, and adds releaseYear.
 *
 * Line derivation:
 *   year <= 1979  → STAR_WARS
 *   1980–1982     → EMPIRE_STRIKES_BACK
 *   1983–1984     → RETURN_OF_THE_JEDI
 *   1985+         → POWER_OF_THE_FORCE
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/patch-star-wars-line.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const JSON_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/star-wars-catalog.json',
);

function yearToLine(year: number | null): string | null {
  if (year === null) return null;
  if (year <= 1979) return 'STAR_WARS';
  if (year <= 1982) return 'EMPIRE_STRIKES_BACK';
  if (year <= 1984) return 'RETURN_OF_THE_JEDI';
  return 'POWER_OF_THE_FORCE';
}

interface CatalogRecord {
  name: string;
  year: number | null;
  line: string | null;
  coinIncluded: boolean | null;
  releaseYear?: number | null;
  [key: string]: unknown;
}

const data: CatalogRecord[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

let lineSet = 0;
let coinSet = 0;

for (const record of data) {
  const line = yearToLine(record.year);
  record.line = line;
  record.releaseYear = record.year ?? null;

  if (line === 'POWER_OF_THE_FORCE') {
    record.coinIncluded = true;
    coinSet++;
  } else {
    record.coinIncluded = record.coinIncluded ?? null;
  }

  lineSet++;
}

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');

console.log(`Patched ${lineSet} records with line + releaseYear.`);
console.log(`Set coinIncluded=true for ${coinSet} POWER_OF_THE_FORCE items.`);

const lineCounts: Record<string, number> = {};
for (const r of data) {
  const key = r.line ?? 'null';
  lineCounts[key] = (lineCounts[key] ?? 0) + 1;
}
console.log('\nLine distribution:');
for (const [line, count] of Object.entries(lineCounts)) {
  console.log(`  ${line}: ${count}`);
}
