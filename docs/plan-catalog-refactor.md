# Plan: Catalog/User-Items Split + Star Wars Pre-Population

**Status:** Complete  
**Completed:** 2026-04-19  
**Last updated:** 2026-04-06 (decisions); 2026-04-19 (status update)

All phases implemented. Schema, seed data (769 records), API endpoints, and web frontend are all live on `develop`/`main`. This file is preserved as a decision record — the architectural decisions below remain accurate and are not derivable from the code alone.

---

## Decisions Made

| Topic | Decision |
|---|---|
| Architecture | Separate catalog tables + user_items tables (per collection) |
| Catalog table shape | Flat table with `category` enum + typed nullable columns (no JSONB) |
| Vehicles/Playsets | Same catalog table as figures; `category` enum distinguishes them |
| Variants | Separate catalog entries (vinyl cape Jawa and cloth cape Jawa are distinct rows) |
| Wishlist prioritization | `WishlistPriority` enum: HIGH / MEDIUM / LOW on user_items |
| Target condition | Deferred — not in scope |
| Catalog images | Scraped from transformerland.com; stored in catalog table as `catalogImageUrl` |
| User photos | Separate `photoUrls[]` on user_items; unchanged from current model |
| Seed data format | JSON files committed to git under `packages/api/src/database/seeds/data/` |
| Auth | All endpoints protected by `JwtAuthGuard` — catalog is not public |
| Scraping source | transformerland.com — same site covers Star Wars, Transformers, He-Man |
| Collection order | Star Wars first; Transformers and He-Man follow same pattern later |

---

## New Table Design

### Catalog tables (no userId — shared truth)

**`star_wars_catalog`**

Common columns:
- `id` uuid PK
- `name` varchar NOT NULL
- `category` enum: `BASIC_FIGURE | VEHICLE | PLAYSET | CREATURE | MINI_RIG | ACCESSORY | TWELVE_INCH | COLLECTOR_CASE | ROLEPLAY | DIE_CAST`
- `line` enum: `STAR_WARS | EMPIRE_STRIKES_BACK | RETURN_OF_THE_JEDI | POWER_OF_THE_FORCE` (nullable)
- `accessories` text[] — what should come with it
- `catalogImageUrl` varchar nullable
- `sourceUrl` varchar nullable — transformerland detail page URL
- `externalId` varchar nullable — transformerland item ID (from URL slug)
- `isVariant` boolean default false
- `variantDescription` varchar nullable
- `createdAt`, `updatedAt`

Figure-specific nullable columns:
- `figureSize` enum: `3.75 | 12 | MINI`
- `cardbackStyle` enum (existing CardbackStyle values)
- `kennerItemNumber` varchar
- `coinIncluded` boolean — POTF coins

Vehicle/Playset-specific nullable columns:
- `features` text[] — e.g., "opening cockpit", "firing missiles"

**`g1_transformers_catalog`** and **`masters_catalog`** — same pattern, defined now, seeded later.

### User items tables (userId + catalogId)

**`user_star_wars_items`**

- `id` uuid PK
- `catalogId` uuid FK → `star_wars_catalog` NOT NULL
- `userId` uuid FK → `users` NOT NULL
- UNIQUE constraint on `(catalogId, userId)`
- `isOwned` boolean default false
- `wishlistPriority` enum: `HIGH | MEDIUM | LOW` nullable — meaningful only when `!isOwned`
- `condition` enum (ConditionGrade) nullable
- `packagingCondition` enum (PackagingCondition) nullable
- `isComplete` boolean default false
- `ownedAccessories` text[] default {} — subset of catalog accessories actually owned
- `isCarded` boolean default false — you kept it on card
- `isBoxed` boolean default false — you kept it boxed (vehicles/playsets)
- `acquisitionSource` enum nullable
- `acquisitionDate` date nullable
- `acquisitionPrice` numeric(10,2) nullable
- `estimatedValue` numeric(10,2) nullable
- `notes` text nullable
- `photoUrls` text[] default {} — your own photos
- `createdAt`, `updatedAt`

**`user_g1_transformers_items`** and **`user_masters_items`** — same pattern.

---

## Phase 1 — Shared Types (`packages/shared`)

- Add `StarWarsCategory` enum to `star-wars.ts`
- Add `WishlistPriority` enum to `common.ts`
- Add `StarWarsCatalogItem` interface
- Add `UserStarWarsItem` interface (replaces current `StarWarsFigure`)
- Update Transformers and He-Man types to split into catalog vs. user interfaces
  (even though their scrapers come later, the types should be correct now)

---

## Phase 2 — Database Migration

One new TypeORM migration that:
1. Drops `star_wars_figures`, `g1_transformers`, `masters_figures` (no real data — safe to drop)
2. Creates `star_wars_catalog`, `g1_transformers_catalog`, `masters_catalog`
3. Creates `user_star_wars_items`, `user_g1_transformers_items`, `user_masters_items`

All three catalog + user_items pairs are created now even though only Star Wars gets seeded immediately. Avoids a second structural migration later.

---

## Phase 3 — API Entities + Modules (`packages/api`)

### New entities
- `StarWarsCatalogEntity` → `star_wars_catalog`
- `UserStarWarsItemEntity` → `user_star_wars_items`
- `G1TransformersCatalogEntity` → `g1_transformers_catalog`
- `UserG1TransformersItemEntity` → `user_g1_transformers_items`
- `MastersCatalogEntity` → `masters_catalog`
- `UserMastersItemEntity` → `user_masters_items`

### New/updated services
- `StarWarsCatalogService` — browse and search the catalog
- `UserStarWarsItemsService` — CRUD on personal records

### Endpoints (all protected by `JwtAuthGuard`)
- `GET /collections/star-wars/catalog` — paginated catalog browse; filter by `category`, `line`
- `GET /collections/star-wars/catalog/:id` — single catalog item detail
- `GET /collections/star-wars/items` — user's personal records (owned + wishlist)
- `POST /collections/star-wars/items` — claim a catalog item (create user record)
- `PATCH /collections/star-wars/items/:id` — update condition, status, priority, etc.
- `DELETE /collections/star-wars/items/:id` — remove personal record

---

## Phase 4 — Scraper Script

**Location:** `scripts/scrape-star-wars-catalog.ts`  
**Run via:** `npm run scrape:star-wars` (added to root `package.json`)

### What it does
1. Fetches the transformerland.com Star Wars Original Kenner Series index page
2. Parses all items by section — derives `StarWarsCategory` from section heading
3. For each item, fetches its detail page to extract:
   - Catalog image URL
   - Accessory list
   - Era/line info (Star Wars / ESB / ROTJ / POTF)
   - Figure-specific fields where available (figureSize, kennerItemNumber, coinIncluded)
4. Rate-limits to ~1 request/second
5. Outputs `packages/api/src/database/seeds/data/star-wars-catalog.json`

### Output format
```json
[
  {
    "externalId": "46847",
    "name": "Han Solo",
    "category": "BASIC_FIGURE",
    "line": "STAR_WARS",
    "figureSize": "3.75",
    "accessories": ["Blaster Pistol"],
    "isVariant": false,
    "variantDescription": null,
    "catalogImageUrl": "https://...",
    "sourceUrl": "https://www.transformerland.com/wiki/toy-info/..."
  }
]
```

The JSON file is **committed to git** — it serves as:
- The authoritative scraped dataset for seeding
- A durable record for future evaluations (completeness checks, data quality review, diffing against updated scrapes)

---

## Phase 5 — Seed Runner

**Location:** `packages/api/src/database/seeds/run-star-wars-seed.ts`  
**Run via:** `npm run seed:star-wars`

Reads `data/star-wars-catalog.json` and inserts into `star_wars_catalog`. Uses `INSERT ... ON CONFLICT (externalId) DO NOTHING` — idempotent, safe to re-run.

---

## Phase 6 — Web Frontend (`packages/web`)

Update Star Wars collection views only (Transformers and He-Man views untouched until their data is ready):

- **Collection list page** — shows catalog items; each card indicates owned / on wishlist / unclaimed
- **Item detail page** — shows catalog image + expected accessories alongside personal record fields
- **Claim flow** — browse catalog → mark as owned or add to wishlist (replaces blank "add item" form)
- **Wishlist view** — filterable/sortable by priority

---

## Phase 7 — Jira (do this first, before any code)

- Review COL-10 and adjacent open tickets; supersede or update as needed
- Create new stories covering Phases 1–6 and Phase 8
- Transition completed stories to Done as each phase lands

---

## Phase 8 — Documentation

- Append session summary to `docs/setup-log.md`
- Update `docs/project-structure.md` for new files/dirs added (scripts/, seeds/data/, new entities)
- Update relevant Confluence pages (architecture, data model, API reference)
- Update root `README.md` with new npm scripts (`scrape:star-wars`, `seed:star-wars`)

---

## Execution Order

1. **Jira** — create tickets first
2. Phases 1–6 — implement in order (each phase unblocks the next)
3. **Phase 8** — documentation last, after everything is working

---

## Out of Scope (this session)

- Transformers and He-Man scrapers (same pattern, deferred)
- Mobile app catalog awareness
- Price guide / external value data
- Target condition on wishlist items
