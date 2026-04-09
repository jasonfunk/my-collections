/**
 * Post-processes he-man-catalog.json to set characterType based on known MOTU lore.
 * The transformerland.com site doesn't encode faction in the URL, so this must be patched in.
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/patch-he-man-charactertype.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/he-man-catalog.json',
);

// ---------------------------------------------------------------------------
// Classification map: item name → MastersCharacterType enum value
// null = not a character (vehicle, playset, accessory, meteorb with no faction, etc.)
// ---------------------------------------------------------------------------

const CHARACTER_TYPE_MAP: Record<string, string | null> = {
  // ── Heroic Warriors ────────────────────────────────────────────────────
  'He-Man': 'HEROIC',
  'Man-At-Arms': 'HEROIC',
  'Teela': 'HEROIC',
  'Stratos (blue)': 'HEROIC',
  'Stratos (red)': 'HEROIC',
  'Ram Man': 'HEROIC',
  'Man-E-Faces': 'HEROIC',
  'Buzz-Off': 'HEROIC',
  'Fisto': 'HEROIC',
  'Mekaneck': 'HEROIC',
  'Roboto': 'HEROIC',
  'Sy-Klone': 'HEROIC',
  'Extendar': 'HEROIC',
  'Snout Spout': 'HEROIC',
  'Clamp Champ': 'HEROIC',
  'Stonedar': 'HEROIC',
  'Rokkon': 'HEROIC',
  'Rio Blast': 'HEROIC',
  'Rotar': 'HEROIC',
  'Prince Adam': 'HEROIC',
  'Orko': 'HEROIC',
  'Sorceress': 'HEROIC',
  'King Randor': 'HEROIC',
  'Moss Man': 'HEROIC',
  'Battle Armor He-Man': 'HEROIC',
  'Thunder Punch He-Man': 'HEROIC',
  'Flying Fists He-Man': 'HEROIC',
  'Laser Power He-Man': 'HEROIC',
  'He-Man (Wonder Bread)': 'HEROIC',

  // ── Evil Warriors ──────────────────────────────────────────────────────
  'Skeletor': 'EVIL',
  'Beast Man': 'EVIL',
  'Evil-Lyn': 'EVIL',
  'Trap Jaw': 'EVIL',
  'Mer-Man': 'EVIL',
  'Clawful': 'EVIL',
  'Whiplash': 'EVIL',
  'Leech': 'EVIL',
  'Modulok': 'EVIL',
  'Stinkor': 'EVIL',
  'Spikor': 'EVIL',
  'Webstor': 'EVIL',
  'Kobra Khan': 'EVIL',
  'Jitsu': 'EVIL',
  'Two Bad': 'EVIL',
  'Dragon Blaster Skeletor': 'EVIL',
  'Battle Armor Skeletor': 'EVIL',
  'Terror Claws Skeletor': 'EVIL',
  'Laser-Light Skeletor': 'EVIL',
  'Faker': 'EVIL',          // evil duplicate of He-Man

  // Horde
  'Hordak': 'EVIL',
  'Horde Trooper': 'EVIL',
  'Hurricane Hordak': 'EVIL',
  'Buzz-Saw Hordak': 'EVIL',
  'Dragstor': 'EVIL',
  'Mantenna': 'EVIL',
  'Grizzlor (lighter brown)': 'EVIL',
  'Grizzlor (darker brown)': 'EVIL',

  // Snake Men
  'King Hiss': 'EVIL',
  'Rattlor': 'EVIL',
  'Tung Lashor': 'EVIL',
  'Snake Face': 'EVIL',
  'Sssqueeze': 'EVIL',

  // Evil robotic/misc
  'Blast-Attak': 'EVIL',
  'Multi-Bot': 'EVIL',
  'Tri-Klops': 'EVIL',
  'Ninjor': 'EVIL',
  'Scare Glow': 'EVIL',
  'Twistoid': 'EVIL',
  'Mosquitor': 'EVIL',

  // Movie figures
  'Blade': 'EVIL',
  'Saurod': 'EVIL',
  'Gwildor': 'NEUTRAL',     // Heroic ally in movie but coded as Neutral

  // ── Neutral ────────────────────────────────────────────────────────────
  'Zodac': 'NEUTRAL',       // Cosmic Enforcer — officially neutral

  // ── Heroic Allies (beasts/companions of heroic warriors) ───────────────
  'Battle Cat': 'HEROIC_ALLY',
  'Zoar': 'HEROIC_ALLY',
  'Battle Bones': 'HEROIC_ALLY',
  'Bionatops': 'HEROIC_ALLY',
  'Turbodactyl': 'HEROIC_ALLY',
  'Mantisaur': 'EVIL_ALLY',    // evil creature
  'Monstroid': 'EVIL_ALLY',    // evil creature
  'Tyrantisaurus Rex': 'EVIL_ALLY',

  // ── Evil Allies ────────────────────────────────────────────────────────
  'Panthor': 'EVIL_ALLY',
  'Screeech': 'EVIL_ALLY',

  // Meteorbs (half heroic / half evil — classified by allegiance)
  'Astro Lion': 'HEROIC_ALLY',
  'Comet Cat': 'HEROIC_ALLY',
  'Cometroid': 'HEROIC_ALLY',
  'Tuskor': 'HEROIC_ALLY',
  'Ty-Grrr': 'HEROIC_ALLY',
  'Crocobite': 'EVIL_ALLY',
  'Dinosorb': 'EVIL_ALLY',
  'Gore-Illa': 'EVIL_ALLY',
  'Orbear': 'EVIL_ALLY',
  'Rhinorb': 'EVIL_ALLY',

  // 12-inch Europe exclusives
  'Megator': 'EVIL',
  'Tytus': 'HEROIC',

  // ── Non-characters (vehicles, playsets, accessories, cases) ────────────
  // Left out of map — will remain null
};

interface CatalogEntry {
  externalId: string;
  name: string;
  characterType: string | null;
  [key: string]: unknown;
}

const data: CatalogEntry[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

let patched = 0;
let unrecognized: string[] = [];

for (const entry of data) {
  if (entry.name in CHARACTER_TYPE_MAP) {
    const mapped = CHARACTER_TYPE_MAP[entry.name];
    if (mapped !== entry.characterType) {
      entry.characterType = mapped;
      patched++;
    }
  } else {
    // Only flag non-null items that we don't recognize as characters
    // (vehicles, playsets, accessories intentionally stay null)
    const isLikelyCharacter = !entry.name.match(
      /case|castle|mountain|pit|zone|fighter|trak|ram$|sled|blaster|laser bolt|ripper|stalker|walker|shark|hawk|climber|tools|pak|vat|stalkers|thunder punch ammo|tower tools|weapons pak|slime vat|cliff climber|scubattack|megalaser|jet sled|beam-blaster/i,
    );
    if (isLikelyCharacter) {
      unrecognized.push(entry.name);
    }
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');

console.log(`Patched characterType for ${patched} entries.`);
if (unrecognized.length > 0) {
  console.warn(`\nUnrecognized (characterType remains null):`);
  for (const name of unrecognized) {
    console.warn(`  ${name}`);
  }
}
console.log('Done.');
