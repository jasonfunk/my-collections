# Catalog Data Gaps

Reference document for the catalog enrichment effort. Updated as gaps are filled.

**Last evaluated:** 2026-04-26  
**Total records:** Star Wars 199 / G1 Transformers 443 / He-Man 127

---

## Star Wars (199 records)

### Complete fields ✓
- `name`, `category`, `figureSize` (correct nulls for non-figures), `accessories` (partial), `catalogImageUrl` (partial), `externalId` (partial), `isVariant` (partial)
- `year` — 100% populated in JSON; not persisted to DB (no `releaseYear` column)

### Gaps

| Field | Populated | Gap | Notes |
|---|---|---|---|
| `line` | 0/199 | 199 | Derivable from `year` in JSON |
| `kennerItemNumber` | 0/199 | 199 | transformerland.com "ID:" row is empty for SW items — site limitation |
| `coinIncluded` | 0/199 | ~17 | Only POTF figures; derivable from `line == POWER_OF_THE_FORCE` |
| `cardbackStyle` | 0/199 | 199 | Not on transformerland.com; requires RebelScum.com or catalog scans |
| `features` | 0/199 | ~29 | Vehicle/playset feature descriptions; not attempted |
| `accessories` | 152/199 | 47 | Extractors fixed (COL-102). 47 empties are all legitimate zeros: BASIC_FIGURE (12), VEHICLE (9), MINI_RIG (8), COLLECTOR_CASE (7), DIE_CAST (5), ROLEPLAY (3), CREATURE (2), TWELVE_INCH (1). Zero empty regular FIGURE items. |
| `catalogImageUrl` | 190/199 | 9 | The 9 twelve-inch patch figures (no transformerland.com entry) |
| `externalId` | 190/199 | 9 | Same 9 patch figures |
| `isVariant` | 1/199 | many | Known variants not captured: vinyl cape Jawa, double-telescoping sabers, etc. |
| `releaseYear` | N/A | — | Entity column missing (parity gap vs. TF + HM which both have it) |

**Line derivation logic:**

```
year <= 1979  → STAR_WARS
1980–1982     → EMPIRE_STRIKES_BACK
1983–1984     → RETURN_OF_THE_JEDI
1985          → POWER_OF_THE_FORCE
```

**POTF figures (coinIncluded = true):** ~17 items with `line == POWER_OF_THE_FORCE`

---

## G1 Transformers (443 records)

### Complete fields ✓
- `name`, `faction`, `line`, `releaseYear`, `catalogImageUrl`, `externalId`, `isCombiner`, `combinerTeam` (correct nulls for non-combiners)
- `releaseYear` entity column added COL-102 (was in JSON but missing from entity)

### Gaps

| Field | Populated | Gap | Notes |
|---|---|---|---|
| `altMode` | 0/443 | 443 | Explicitly deferred; not in transformerland.com structured data. Best source: TFWiki MediaWiki API |
| `size` | not in JSON | 443 | Field in entity + shared type but **never written to JSON**; scraper didn't attempt it |
| `accessories` | 261/443 | 182 | Extractors fixed (COL-102). 182 gap is largely legitimate zeros: Decoys (~73, named "X (purple/red/etc)"), Mini-Autobots (~12, no accessories), Combiners (~10). Site doesn't carry accessory data for these item types. |
| `isVariant` | 0/443 | many | Pre-rub/post-rub, color variants not captured |
| `variantDescription` | 0/443 | many | Same |
| `japaneseRelease` | all false | many | Many S1/S2 have Takara counterparts; TFWiki per-item pages have this |
| `isGiftSet` | all false | some | Some multi-packs/gift sets exist |
| `features` | not in JSON | — | Field in entity but absent from JSON entirely |

**`size` enum values:** MINI / SMALL / MEDIUM / LARGE / JUMBO  
**`altMode` examples:** "Porsche 911", "F-15 fighter jet", "Cassette player", "Gun"

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

### Tier 1 — Patch scripts, no scraping (fast)

| Task | What | File |
|---|---|---|
| SW `line` derivation | Patch JSON using `year` field already present | `scripts/patch-star-wars-line.ts` |
| SW `coinIncluded` | Set true for all POTF items as part of same patch | Same script |
| SW `releaseYear` column | Add to entity, migration, shared type | Migration + entity + shared type |
| Seed upsert mode | Add `--update` flag to seed runners | `run-star-wars-seed.ts` etc. |

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
