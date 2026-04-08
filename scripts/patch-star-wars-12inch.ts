/**
 * One-shot patch to add the 9 twelve-inch figures missing from transformerland.com's wiki.
 * Source: https://thetoycollectorsguide.com/star-wars-12-inch/
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/patch-star-wars-12inch.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/star-wars-catalog.json',
);

const SOURCE_URL = 'https://thetoycollectorsguide.com/star-wars-12-inch/';

const MISSING_FIGURES = [
  {
    externalId: null,
    name: 'Artoo-Detoo (R2-D2)',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Death Star Plans', 'Death Star Plans', 'Death Star Plans'],
    isVariant: false,
    variantDescription: null,
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1978,
  },
  {
    externalId: null,
    name: 'Chewbacca',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Wookie Bowcaster', 'Bandolier'],
    isVariant: false,
    variantDescription: null,
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1978,
  },
  {
    externalId: null,
    name: 'Luke Skywalker',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Cloth Shirt', 'Pants', 'Boots', 'Utility Belt', 'Blue Lightsaber', 'Grappling Hook'],
    isVariant: false,
    variantDescription: null,
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1978,
  },
  {
    externalId: null,
    name: 'Princess Leia Organa',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Cloth Dress', 'Belt', 'Socks', 'Shoes', 'Brush', 'Comb'],
    isVariant: false,
    variantDescription: null,
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1978,
  },
  {
    externalId: null,
    name: 'Ben (Obi-Wan) Kenobi',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Cloth Tunic', 'Pants', 'Jedi Robe', 'Boots', 'Yellow Lightsaber'],
    isVariant: false,
    variantDescription: null,
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1979,
  },
  {
    externalId: null,
    name: 'Han Solo',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Cloth Shirt', 'Vest', 'Pants', 'Boots', 'Gun Belt', 'Blaster', 'Medal of Yavin'],
    isVariant: false,
    variantDescription: null,
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1979,
  },
  {
    externalId: null,
    name: 'Jawa',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Cloth Brown Cloak', 'Ammo Bandolier', 'Laser Rifle'],
    isVariant: false,
    variantDescription: null,
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1979,
  },
  {
    externalId: null,
    name: 'Stormtrooper',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Stormtrooper Blaster'],
    isVariant: false,
    variantDescription: null,
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1979,
  },
  // ESB packaging variant of Boba Fett (we already have externalId 165332 = SW packaging)
  {
    externalId: null,
    name: 'Boba Fett (Empire Strikes Back)',
    category: 'TWELVE_INCH',
    line: null,
    figureSize: '12',
    accessories: ['Utility Belt', 'Cape', 'Laser Blaster', 'Wookie Scalps', 'Rocket Pack w/ Missile'],
    isVariant: true,
    variantDescription: 'Empire Strikes Back packaging',
    catalogImageUrl: null,
    sourceUrl: SOURCE_URL,
    kennerItemNumber: null,
    year: 1980,
  },
];

const data: object[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));

// Guard: don't double-apply if already patched
const existingNames = new Set(
  (data as Array<{ name: string; category: string }>)
    .filter((item) => item.category === 'TWELVE_INCH')
    .map((item) => item.name),
);

const toAdd = MISSING_FIGURES.filter((fig) => !existingNames.has(fig.name));

if (toAdd.length === 0) {
  console.log('Nothing to patch — all figures already present.');
  process.exit(0);
}

data.push(...toAdd);
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');

console.log(`Added ${toAdd.length} missing TWELVE_INCH figures:`);
for (const fig of toAdd) {
  console.log(`  ${fig.name} (${fig.year})`);
}

const twelve = (data as Array<{ category: string }>).filter((d) => d.category === 'TWELVE_INCH').length;
console.log(`\nTotal items: ${data.length}  |  TWELVE_INCH count: ${twelve}`);
