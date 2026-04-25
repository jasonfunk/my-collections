/**
 * Patches he-man-catalog.json with miniComic, hasArmorOrFeature, and featureDescription.
 *
 * transformerland.com does not carry this data — confirmed by Playwright inspection (COL-101).
 * Data sourced from MOTU collector databases (He-Man.org, fan wikis).
 *
 * Run: npm run patch:he-man-enrichment
 */
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/he-man-catalog.json',
);

// ---------------------------------------------------------------------------
// Mini-comic map: item name → mini-comic title (null = non-carded or unknown)
// ---------------------------------------------------------------------------

const MINI_COMIC_MAP: Record<string, string | null> = {
  // ── Creature companions ───────────────────────────────────────────────────
  'Battle Cat': 'The Magic Stealer',               // He-Man's mount
  'Zoar': 'The Magic Stealer',                     // Sorceress's falcon
  'Panthor': 'The Magic Stealer',                  // Skeletor's cat

  // ── Wave 1 (1982) ─────────────────────────────────────────────────────────
  'He-Man': 'He-Man and the Power Sword',
  'Man-At-Arms': 'He-Man and the Power Sword',
  'Faker': 'He-Man and the Power Sword',           // He-Man repaint, same comic
  'Skeletor': 'King of Castle Grayskull',
  'Beast Man': 'The Vengeance of Skeletor',
  'Mer-Man': 'The Vengeance of Skeletor',
  'Teela': 'Teela the Warrior Goddess',
  'Stratos (blue)': 'Battle in the Clouds',
  'Stratos (red)': 'Battle in the Clouds',
  'Zodac': 'Battle in the Clouds',

  // ── Wave 1.5 / early Wave 2 (1982–83) ────────────────────────────────────
  'Ram Man': 'He-Man Meets Ram-Man!',
  'Trap Jaw': 'The Menace of Trap Jaw',
  'Man-E-Faces': 'The Masks of Power',
  'Tri-Klops': 'The Masks of Power',
  'Evil-Lyn': 'The Masks of Power',

  // ── Wave 2 (1983) ─────────────────────────────────────────────────────────
  'Mekaneck': 'The Dragon Invasion',
  'Webstor': 'The Dragon Invasion',
  "Buzz-Off": "Dragon's Gift",
  'Kobra Khan': "Dragon's Gift",
  'Fisto': 'The Clash of Arms',
  'Jitsu': 'The Clash of Arms',
  'Moss Man': 'The Stench of Evil',
  'Stinkor': 'The Stench of Evil',
  'Roboto': 'Greyskull Under Siege',
  'Battle Armor He-Man': 'Greyskull Under Siege',
  'Sy-Klone': 'The Fastest Drawing in the Universe',
  'Clawful': 'Siege of Avion',
  'Whiplash': 'Siege of Avion',

  // ── Wave 3 (1984) ─────────────────────────────────────────────────────────
  'Spikor': 'Double-Edged Sword',
  'Two Bad': 'Double-Edged Sword',
  'Battle Armor Skeletor': 'Double-Edged Sword',

  // ── Wave 3–4 (1984–1985) — Snake Men ─────────────────────────────────────
  'King Hiss': 'The Treachery of Modulok',
  'Rattlor': 'The Treachery of Modulok',
  'Tung Lashor': 'The Treachery of Modulok',
  'Sssqueeze': 'The Treachery of Modulok',
  'Snake Face': 'Snake Attack!',

  // ── Wave 4 (1985) — Horde ─────────────────────────────────────────────────
  'Hordak': 'The Horde',
  'Grizzlor (lighter brown)': 'The Horde',
  'Grizzlor (darker brown)': 'The Horde',
  'Horde Trooper': 'The Horde',
  'Leech': 'Leech: The Master of Power Suction',
  'Mantenna': 'Leech: The Master of Power Suction',
  'Dragstor': 'Energy Zoids',
  'Modulok': 'Energy Zoids',
  'Multi-Bot': 'Energy Zoids',

  // ── Wave 4–5 (1985–1986) ─────────────────────────────────────────────────
  'Rio Blast': 'Battle of the Towers',
  'Extendar': 'Battle of the Towers',
  'Rotar': 'Battle of the Towers',
  'Twistoid': 'Battle of the Towers',
  'Thunder Punch He-Man': 'The Powers of Grayskull — The Legend Begins!',
  'Flying Fists He-Man': 'The Powers of Grayskull — The Legend Begins!',
  'Snout Spout': 'The Powers of Grayskull — The Legend Begins!',
  'Blast-Attak': 'The Powers of Grayskull — The Legend Begins!',

  // ── Wave 5–6 (1986–1987) ─────────────────────────────────────────────────
  'Hurricane Hordak': 'Enter: Buzz-Saw Hordak!',
  'Buzz-Saw Hordak': 'Enter: Buzz-Saw Hordak!',
  'Clamp Champ': 'Enter: Buzz-Saw Hordak!',
  'King Randor': 'Enter: Buzz-Saw Hordak!',
  'Orko': 'Prince Adam No More',
  'Prince Adam': 'Prince Adam No More',
  'Ninjor': 'The Search for Keldor',
  'Scare Glow': 'The Search for Keldor',
  'Terror Claws Skeletor': 'The Search for Keldor',

  // ── Vehicles (no mini-comic) ──────────────────────────────────────────────
  'Roton': null,
  'Spydor': null,
  'Bashasaurus': null,
  'Stridor': null,
  'Wind Raider': null,
  'Screeech': null,                                // evil bird beast

  // ── Needs research (null for now) ─────────────────────────────────────────
  // Dragon Blaster Skeletor (1984)   — comic uncertain
  // Sorceress (1987)                 — very late; possibly no US mini-comic
  // Mosquitor (1987)                 — very late; possibly no US mini-comic
  // He-Man (Wonder Bread)            — mail-away exclusive; no mini-comic
  // Tytus, Megator                   — European exclusives; no US mini-comic
  // Stonedar, Rokkon                 — Rock Warriors (1986); uncertain
  // Meteorbs (10 items)              — uncertain; likely null
  // Laser Power He-Man               — very late; likely no mini-comic
  // Laser-Light Skeletor             — very late; likely no mini-comic

  // ── Non-characters → always null (vehicles, playsets, accessories) ────────
  // Omitted from map — JSON fields stay null (scraper default)
};

// ---------------------------------------------------------------------------
// Feature map: item name → action feature data (null = no feature)
// ---------------------------------------------------------------------------

interface FeatureData {
  hasArmorOrFeature: boolean;
  featureDescription: string;
}

const FEATURE_MAP: Record<string, FeatureData | null> = {
  'Battle Armor He-Man': {
    hasArmorOrFeature: true,
    featureDescription: 'Rotating chest plates with three battle-damage states',
  },
  'Battle Armor Skeletor': {
    hasArmorOrFeature: true,
    featureDescription: 'Rotating chest plates with three battle-damage states',
  },
  'Ram Man': {
    hasArmorOrFeature: true,
    featureDescription: 'Spring-loaded ramming legs',
  },
  'Man-E-Faces': {
    hasArmorOrFeature: true,
    featureDescription: 'Rotating face disc — human, robotic, and monstrous',
  },
  'Trap Jaw': {
    hasArmorOrFeature: true,
    featureDescription: 'Swivel jaw and interchangeable arm attachments',
  },
  'Roboto': {
    hasArmorOrFeature: true,
    featureDescription: 'Waist twist animates visible gears in clear chest',
  },
  'Mekaneck': {
    hasArmorOrFeature: true,
    featureDescription: 'Twist base extends neck',
  },
  'Sy-Klone': {
    hasArmorOrFeature: true,
    featureDescription: 'Spinning gyro torso',
  },
  'Dragon Blaster Skeletor': {
    hasArmorOrFeature: true,
    featureDescription: 'Water-squirting dragon backpack',
  },
  'Thunder Punch He-Man': {
    hasArmorOrFeature: true,
    featureDescription: 'Punching action activates clicking sound disc',
  },
  'Flying Fists He-Man': {
    hasArmorOrFeature: true,
    featureDescription: 'Spin-punch action',
  },
  'Terror Claws Skeletor': {
    hasArmorOrFeature: true,
    featureDescription: 'Spinning claw arms',
  },
  'Hurricane Hordak': {
    hasArmorOrFeature: true,
    featureDescription: 'Spinning arms',
  },
  'King Hiss': {
    hasArmorOrFeature: true,
    featureDescription: 'Flip-open torso reveals inner snake body',
  },
  'Modulok': {
    hasArmorOrFeature: true,
    featureDescription: '22 modular interchangeable body parts',
  },
  'Multi-Bot': {
    hasArmorOrFeature: true,
    featureDescription: 'Modular interchangeable body parts',
  },
  'Rotar': {
    hasArmorOrFeature: true,
    featureDescription: 'Gyroscope spinning torso action',
  },
  'Twistoid': {
    hasArmorOrFeature: true,
    featureDescription: 'Gyroscope spinning torso action',
  },
  'Blast-Attak': {
    hasArmorOrFeature: true,
    featureDescription: 'Spring-loaded exploding body',
  },
  'Sssqueeze': {
    hasArmorOrFeature: true,
    featureDescription: 'Spring-extending arms',
  },
  'Mosquitor': {
    hasArmorOrFeature: true,
    featureDescription: 'Chest blood-pump action',
  },
  'Snake Face': {
    hasArmorOrFeature: true,
    featureDescription: 'Pop-out snakes from face',
  },
  'Leech': {
    hasArmorOrFeature: true,
    featureDescription: 'Suction-cup hands and mouth',
  },
  'Mantenna': {
    hasArmorOrFeature: true,
    featureDescription: 'Spring-loaded pop-up bug eyes',
  },
  'Extendar': {
    hasArmorOrFeature: true,
    featureDescription: 'Extending limbs and torso',
  },
  'Rio Blast': {
    hasArmorOrFeature: true,
    featureDescription: 'Flip-open chest gun',
  },
  'Snout Spout': {
    hasArmorOrFeature: true,
    featureDescription: 'Water-squirting trunk',
  },
  'Hordak': {
    hasArmorOrFeature: true,
    featureDescription: 'Spring-loaded arm cannon',
  },
  'Stinkor': {
    hasArmorOrFeature: true,
    featureDescription: 'Patchouli-scented figure',
  },
  'Moss Man': {
    hasArmorOrFeature: true,
    featureDescription: 'Flocked texture with pine scent',
  },
  'Grizzlor (lighter brown)': {
    hasArmorOrFeature: true,
    featureDescription: 'Flocked fur body',
  },
  'Grizzlor (darker brown)': {
    hasArmorOrFeature: true,
    featureDescription: 'Flocked fur body',
  },
};

// ---------------------------------------------------------------------------
// Patch
// ---------------------------------------------------------------------------

interface CatalogEntry {
  externalId: string;
  name: string;
  miniComic: string | null;
  hasArmorOrFeature: boolean;
  featureDescription: string | null;
  [key: string]: unknown;
}

const data: CatalogEntry[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

let comicPatched = 0;
let featurePatched = 0;
const unrecognizedComic: string[] = [];

for (const entry of data) {
  // Mini-comic
  if (entry.name in MINI_COMIC_MAP) {
    const comic = MINI_COMIC_MAP[entry.name];
    if (comic !== entry.miniComic) {
      entry.miniComic = comic;
      if (comic !== null) comicPatched++;
    }
  } else {
    // Only flag character figures — vehicles/playsets legitimately have no comic
    const isLikelyCharacter = !entry.name.match(
      /case|castle|mountain|pit|zone|fighter|trak|ram$|sled|blaster|laser bolt|ripper|stalker|walker|shark|hawk|climber|tools|pak|vat|stalkers|ammo|tower tools|weapons pak|slime vat|cliff climber|scubattack|megalaser|jet sled|beam-blaster|bionatops|turbodactyl|mantisaur|monstroid|tyrantisaurus|battle bones|point dread|eternia/i,
    );
    if (isLikelyCharacter) {
      unrecognizedComic.push(entry.name);
    }
  }

  // Action feature
  if (entry.name in FEATURE_MAP) {
    const feature = FEATURE_MAP[entry.name];
    if (feature !== null) {
      entry.hasArmorOrFeature = feature.hasArmorOrFeature;
      entry.featureDescription = feature.featureDescription;
      featurePatched++;
    }
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');

console.log(`Patched miniComic for ${comicPatched} entries.`);
console.log(`Patched hasArmorOrFeature/featureDescription for ${featurePatched} entries.`);

if (unrecognizedComic.length > 0) {
  console.warn(`\nCharacter figures with no miniComic mapping (may need research):`);
  for (const name of unrecognizedComic) {
    console.warn(`  ${name}`);
  }
}

console.log('Done.');
