# Catalog Data Gaps

Reference document for the catalog enrichment effort. Updated as gaps are filled.

**Last evaluated:** 2026-04-27 (COL-103/COL-104)  
**Total records:** Star Wars 199 / G1 Transformers 443 / He-Man 127

---

## Star Wars (199 records)

### Complete fields ✓
- `name`, `category`, `figureSize` (correct nulls for non-figures), `accessories` (partial), `catalogImageUrl` (partial), `externalId` (partial), `isVariant` (partial)
- `releaseYear` — entity column added (migration `1776200000000`); 100% populated in JSON and DB ✓ (COL-104)
- `line` — entity column present; 199/199 derived from `releaseYear` via patch script ✓ (COL-104)
- `coinIncluded` — entity column present; 21/199 = true (all POTF items) via patch script ✓ (COL-104)

### Gaps

| Field | Populated | Gap | Notes |
|---|---|---|---|
| `kennerItemNumber` | 0/199 | 199 | transformerland.com "ID:" row is empty for SW items — site limitation |
| `cardbackStyle` | 0/199 | 199 | Not on transformerland.com; requires RebelScum.com or catalog scans — **evaluate page structure before scraping** |
| `features` | 0/199 | ~29 | Vehicle/playset feature descriptions; not attempted |
| `accessories` | 152/199 | 47 | Extractors fixed (COL-102). 47 empties are all legitimate zeros: BASIC_FIGURE (12), VEHICLE (9), MINI_RIG (8), COLLECTOR_CASE (7), DIE_CAST (5), ROLEPLAY (3), CREATURE (2), TWELVE_INCH (1). Zero empty regular FIGURE items. |
| `catalogImageUrl` | 190/199 | 9 | The 9 twelve-inch patch figures (no transformerland.com entry) |
| `externalId` | 190/199 | 9 | Same 9 patch figures |
| `isVariant` | 1/199 | many | Known variants not captured: vinyl cape Jawa, double-telescoping sabers, etc. — next session: evaluate RebelScum.com |

---

## G1 Transformers (443 records)

### Complete fields ✓
- `name`, `faction`, `line`, `releaseYear`, `catalogImageUrl`, `externalId`, `isCombiner`, `combinerTeam` (correct nulls for non-combiners)
- `releaseYear` entity column added COL-102 (was in JSON but missing from entity)

### Gaps

| Field | Populated | Gap | Notes |
|---|---|---|---|
| `altMode` | ~223/443 | ~120 non-AM/decoy nulls | **COL-103** — TFWiki + Claude Haiku enrichment. 110 new set this session; 102 no TFWiki match (mostly Micromasters squads, Mini-Spies, variants). ~27 Action Masters (non-transforming) correctly null. |
| `size` | 415/443 | 0 meaningful gaps | **COL-103** — derived from `sourceUrl` slug. 28 null = 27 Action Masters (correct) + 1 unclassified. |
| `accessories` | 261/443 | 182 | Extractors fixed (COL-102). 182 gap is largely legitimate zeros: Decoys (~73, named "X (purple/red/etc)"), Mini-Autobots (~12, no accessories), Combiners (~10). Site doesn't carry accessory data for these item types. |
| `isVariant` | 0/443 | many | Pre-rub/post-rub, color variants not captured |
| `variantDescription` | 0/443 | many | Same |
| `japaneseRelease` | all false | many | Many S1/S2 have Takara counterparts; TFWiki per-item pages have this |
| `isGiftSet` | all false | some | Some multi-packs/gift sets exist |
| `features` | not in JSON | — | Field in entity but absent from JSON entirely |

**`size` enum values:** MINI / SMALL / MEDIUM / LARGE / JUMBO  
**`altMode` examples:** "Porsche 911", "F-15 fighter jet", "Cassette player", "Gun"

### altMode gaps — 111 records still null (should transform)

Excludes Action Masters (27, non-transforming by design), Decoys (73, rubber figures), and full gestalt combiners (Superion, Devastator, etc. — no individual alt mode).

#### Tier A — Patchable without network ✓ RESOLVED (COL-103/104)

Mini-Spies: 24 records patched via `scripts/patch-transformers-mini-spy-altmode.ts`. altMode derived from name prefix: `Dune Buggy → Dune buggy`, `FX-1 → FX-1`, `Jeep → Jeep`, `Porsche → Porsche`. All 24 updated in JSON + DB.

#### Tier B — Individual figures; TFWiki likely has a page (39)

These are named characters that should have TFWiki articles — either the lookup failed (name mismatch, missing disambiguation) or Claude returned null on sparse prose. Good candidates for a second-pass enrichment with tweaked queries.

**Headmasters:** Apeface, Fangry, Horri-Bull  
**Powermasters:** Doubledealer, Dreadwing, Getaway  
**Pretenders:** Cloudburst, Doubleheader, Finback, Groundbreaker, Longtooth, Octopunch, Pincher, Roadgrabber, Skullgrin, Sky High, Snarler, Splashdown, Stranglehold, Waverider  
**Targetmasters:** Landfill, Pointblank, Quake, Quickmix, Scoop  
**Monsterbots:** Doublecross, Grotusque  
**Sparkabots/Firecons:** Fizzle, Sparkstalker  
**Other:** Barrage (Insecticon), Flywheels (Duocon), Razorclaw (Predacon limb), Whirl (Deluxe Vehicle), Overdrive (Omnibot), Punch / Counterpunch, Quickswitch (Six-Changer)

#### Tier C — No clean TFWiki individual page expected (24)

Micromaster squads and multi-packs: listed as a set, no individual page per member. Alt modes would need manual entry or a different source.

**Individual Micromasters:** Ironworks, Roughstuff, Skyhopper  
**Micromaster squads:** Air Patrol, Air Strike Patrol, Astro Squad, Battle Patrol, Battle Squad, Construction Patrol, Constructor Squad, Hot House, Hot Rod Patrol, Metro Squad, Military Patrol, Monster Truck Patrol, Off-Road Patrol, Race Car Patrol, Race Track Patrol, Sports Car Patrol  
**Micromaster combiner bases:** Anti-Aircraft Base with Blackout and Spaceshot, Battlefield Headquarters with Full-Barrel and Overflow, Cannon Transport with Cement-Head and Terror-Tread, Missile Launcher with Retro and Surge, Tanker Truck with Pipeline and Gusher

#### Tier D — Edge cases (24)

Need manual lookup or are genuinely ambiguous.

**Mini-cassettes (humanoid robot forms):** Eject, Frenzy, Grandslam, Raindance, Rewind, Rumble, Squawkbox  
**Combiner limb bots (TFWiki match failed):** Birdbrain, Bristleback, Nautilator, Scattershot, Wildfly  
**Clones (dual-pack entries):** Fastlane and Cloudraker, Pounce and Wingspan  
**Powerdashers (mail-away):** Drill Dasher, F1 Dasher, Sky Dasher  
**Well-known misses:** Fortress Maximus, Galvatron, Rodimus Prime  
**Other:** Bumblebee (Red), Bumblejumper, Cliffjumper (Yellow), Goldbug, Time Warrior Watch (non-transformer toy)

---

## He-Man / Masters (127 records)

### Complete fields ✓
- `name`, `line` (all ORIGINAL), `releaseYear`, `catalogImageUrl`, `externalId`
- `characterType` — 95/127 (correct nulls for non-figure items like vehicles/playsets)
- `miniComic` — 65/127 ✓ (COL-101; patch script; remaining 22 are European exclusives, mail-away, very late/movie figures — legitimately null)
- `hasArmorOrFeature` — 32 figures true ✓ (COL-101)
- `featureDescription` — 32/32 populated ✓ (COL-101)

### Gaps

| Field | Populated | Gap | Notes |
|---|---|---|---|
| `accessories` | 108/127 | 19 | Missing for some vehicles/playsets |
| `isVariant` | 0/127 | some | No variants captured |
| `variantDescription` | 0/127 | some | Same |

---

## Fill Strategy by Tier

### Tier 1 — Patch scripts, no scraping ✓ COMPLETE

| Task | What | Status |
|---|---|---|
| SW `line` derivation | Derived from `year` via `scripts/patch-star-wars-line.ts` | ✓ Done (COL-104) |
| SW `coinIncluded` | 21 POTF records set to true via same script | ✓ Done (COL-104) |
| SW `releaseYear` column | Entity column + migration `1776200000000` | ✓ Done (prior session) |
| Seed upsert mode | `--update` flag on all three seed runners | ✓ Done |
| TF Mini-Spy `altMode` | 24 records set via `scripts/patch-transformers-mini-spy-altmode.ts` | ✓ Done (COL-104) |

### Tier 2 — Re-scrape with enhanced extractors

| Task | What | File |
|---|---|---|
| He-Man `miniComic` / `hasArmorOrFeature` / `featureDescription` | ~~Re-scrape~~ **Done — patch script** (COL-101; data not on site) | `scripts/patch-he-man-enrichment.ts` |
| SW accessories (partial) | ~~Improved selectors~~ **Done (COL-102)** — extractors fixed; 47 remaining empties are all legitimate zeros | `scripts/scrape-star-wars-catalog.ts` |
| TF accessories (partial) | ~~Improved selectors~~ **Done (COL-102)** — extractors fixed; 182 remaining empties are largely legitimate zeros (Decoys, Mini-Autobots, Combiners) | `scripts/scrape-transformers-catalog.ts` |

### Tier 3 — External sources

| Task | What | Source |
|---|---|---|
| TF `altMode` | Most valuable TF collector data point | TFWiki MediaWiki API |
| TF `size` | Size class per item | TFWiki or infer from subgroup |
| TF `japaneseRelease` | Takara counterpart flag | TFWiki per-item pages |
| SW `cardbackStyle` | Cardback variant per figure | RebelScum.com figure guide |
| SW `kennerItemNumber` | Kenner item numbers | RebelScum.com or catalog scans |
| All `isVariant` / variants | Known variants for each collection | RebelScum (SW), TFWiki (TF), He-Man.org (MOTU) |

---

## DB Update Strategy

Seed runners currently use `ON CONFLICT (externalId) DO NOTHING` — insert-only, won't update existing rows.

**To backfill enriched data:** add `--update` flag to seed runners that switches to:
```sql
ON CONFLICT (externalId) DO UPDATE SET
  line = EXCLUDED.line,
  coinIncluded = EXCLUDED.coinIncluded,
  releaseYear = EXCLUDED.releaseYear,
  -- all nullable fields
```

**Workflow:** JSON (ground truth) → update seed runner to upsert mode → re-run against dev DB → commit JSON.

---

## Related Scripts

| Script | Purpose |
|---|---|
| `scripts/scrape-star-wars-catalog.ts` | Playwright scraper for transformerland.com SW catalog |
| `scripts/scrape-transformers-catalog.ts` | Same for G1 Transformers |
| `scripts/scrape-he-man-catalog.ts` | Same for MOTU |
| `scripts/patch-star-wars-12inch.ts` | Manual patch: 9 twelve-inch figures missing from site |
| `scripts/patch-he-man-charactertype.ts` | Manual patch: characterType for items missing from scrape |
| `scripts/patch-he-man-enrichment.ts` | Manual patch: miniComic, hasArmorOrFeature, featureDescription (COL-101) |
