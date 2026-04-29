/**
 * Patches catalogImageUrl for the 9 Star Wars twelve-inch figures.
 * Images sourced from Wookieepedia character articles; verified via Haiku vision.
 *
 * Run: npm run patch:star-wars-12inch-images
 */
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/star-wars-catalog.json',
);

// Base Wookieepedia CDN URLs — no /revision/latest/... suffix, which causes 404s
// when loaded as cross-origin subresources from non-wikia domains.
const IMAGES: Record<string, string> = {
  'Artoo-Detoo (R2-D2)': 'https://static.wikia.nocookie.net/starwars/images/9/95/R2-D2-TROSOCE.png',
  'Chewbacca': 'https://static.wikia.nocookie.net/starwars/images/4/48/Chewbacca_TLJ.png',
  'Luke Skywalker': 'https://static.wikia.nocookie.net/starwars/images/3/3d/LukeSkywalker.png',
  'Princess Leia Organa': 'https://static.wikia.nocookie.net/starwars/images/f/f1/Leia_Organa_TROS.png',
  'Ben (Obi-Wan) Kenobi': 'https://static.wikia.nocookie.net/starwars/images/4/4e/ObiWanHS-SWE.jpg',
  'Han Solo': 'https://static.wikia.nocookie.net/starwars/images/e/e2/TFAHanSolo.png',
  'Jawa': 'https://static.wikia.nocookie.net/starwars/images/b/bd/Jawas-SWApp.png',
  'Stormtrooper': 'https://static.wikia.nocookie.net/starwars/images/b/b9/Stormtrooper-ROOCE.png',
  'Boba Fett (Empire Strikes Back)': 'https://static.wikia.nocookie.net/starwars/images/8/8a/AHunterGathers-AORBobaFett1.png',
};

interface CatalogEntry {
  name: string;
  category: string;
  catalogImageUrl: string | null;
  [key: string]: unknown;
}

function main() {
  const records: CatalogEntry[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  let updated = 0;

  for (const record of records) {
    if (record.category !== 'TWELVE_INCH') continue;
    const url = IMAGES[record.name];
    if (!url) continue;
    record.catalogImageUrl = url;
    console.log(`  ✓ ${record.name}`);
    updated++;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2) + '\n');
  console.log(`\nUpdated ${updated} records. Writing ${DATA_PATH}`);
}

main();
