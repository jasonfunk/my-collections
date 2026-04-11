---
confluence_page_id: "3637269"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3637269"
title: "My Collections — Star Wars Figures"
last_updated: "2026-04-10"
---

Base URL: `/collections/star-wars`. All endpoints require `Authorization: Bearer <access_token>`. Common fields (condition, photoUrls, etc.) are documented on the parent Collections API page.

## Data Model

Star Wars data is split across two tables to separate catalog knowledge from personal collection records:

- `star_wars_catalog` — What Kenner made. Pre-populated from a scraped 199-item dataset. Read-only via API. Includes name, category, year, catalog image, accessories list, and Kenner item number.
- `user_star_wars_items` — Your personal records. Each row links to a catalog entry and adds ownership data: condition, packaging, cardback style, accessories owned, acquisition details, photos, notes, and wishlist priority.

## StarWarsCategory Enum

- `BASIC_FIGURE` — 3.75" standard figures
- `TWELVE_INCH` — 12" large-scale figures
- `VEHICLE` — Vehicles and ships
- `PLAYSET` — Playsets
- `CREATURE` — Creature and animal figures
- `MINI_RIG` — Mini Rigs (small vehicle sets)
- `ACCESSORY` — Standalone accessory sets
- `COLLECTOR_CASE` — Figure storage/display cases
- `ROLEPLAY` — Role-play items (lightsabers, helmets)
- `DIE_CAST` — Die-cast metal vehicles

## StarWarsLine Enum

The product line / release era. Tracks which theatrical release the item was associated with.

- `STAR_WARS` — 1977–1978 original line
- `EMPIRE_STRIKES_BACK` — 1980–1982
- `RETURN_OF_THE_JEDI` — 1983–1984
- `POWER_OF_THE_FORCE` — 1984–1985 (final line; includes collector coins)

## Catalog Fields

Fields returned by `GET /collections/star-wars/catalog` and `GET /collections/star-wars/catalog/:id`:

| **Field** | **Type** | **Description** |
| --- | --- | --- |
| `id` | string (UUID) | Unique catalog entry ID |
| `name` | string | Figure/item name |
| `category` | StarWarsCategory | Product category (see enum above) |
| `line` | StarWarsLine \| null | Release era (STAR_WARS, ESB, ROTJ, POTF) |
| `catalogImageUrl` | string \| null | Reference image URL from original catalog source |
| `accessories` | string\[\] | All original accessories included with this item |
| `kennerItemNumber` | string \| null | Kenner catalog/item number |
| `figureSize` | FigureSize \| null | `3.75`, `12`, or `MINI` — null for vehicles/playsets |
| `features` | string\[\] | Vehicle/playset features (e.g., "opening cockpit") |
| `isVariant` | boolean | True if this is a production variant |
| `variantDescription` | string \| null | Variant details (e.g. "vinyl cape", "cloth cape") |
| `coinIncluded` | boolean \| null | POTF collector coin present |
| `externalId` | string \| null | ID from transformerland.com; null for manually-curated entries |

## User Item Fields

These fields supplement the Common Fields defined on the parent Collections API page. Used with `POST /collections/star-wars/items` and `PATCH /collections/star-wars/items/:id`:

| **Field** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `catalogItemId` | string (UUID) | **yes** | ID of the catalog entry this item records |
| `isCarded` | boolean | **yes** | Has original packaging/card |
| `cardbackStyle` | CardbackStyle | _no_ | Cardback variant (12_BACK through POTF) |
| `coinIncluded` | boolean | _no_ | POTF collector coin present |
| `ownedAccessories` | string\[\] | _no_ | Accessories you actually have (subset of catalog accessories) |
| `wishlistPriority` | WishlistPriority | _no_ | LOW / MEDIUM / HIGH — only meaningful when isOwned = false |

### CardbackStyle Enum

- `12_BACK`
- `20_BACK`
- `31_BACK`
- `45_BACK`
- `48_BACK`
- `65_BACK`
- `77_BACK`
- `ESB`
- `ROTJ`
- `POTF`

## Endpoints

### Catalog (read-only)

- `GET /collections/star-wars/catalog` — Browse the pre-populated catalog. Query filters: `category` (StarWarsCategory), `line` (StarWarsLine), `search` (case-insensitive name match), `page`, `limit`
- `GET /collections/star-wars/catalog/:id` → 200 / 404

### User Items

- `GET /collections/star-wars/items` — List your personal items. Query filters: `owned` (boolean), `condition` (ConditionGrade), `search` (name/notes), `acquisitionSource` (AcquisitionSource), `isComplete` (boolean)
- `POST /collections/star-wars/items` — Claim a catalog item (add to owned collection or wishlist) → 201
- `PATCH /collections/star-wars/items/:id` — Partial update → 200
- `PATCH /collections/star-wars/items/:id/acquired` — Mark a wishlist item as acquired (sets isOwned=true) → 200
- `DELETE /collections/star-wars/items/:id` → 204 / 404

### Wishlist

- `GET /collections/star-wars/wishlist` — List wishlist items (isOwned=false) sorted by wishlistPriority. Query filters: `page`, `limit`

## Seed Data

The catalog is pre-populated with 199 Original Kenner Series items (1977–1985):

- 190 items scraped from transformerland.com using Playwright (headless: false required for Cloudflare bypass)
- 9 twelve-inch figures manually curated from thetoycollectorsguide.com (transformerland.com's 12" section was incomplete)

Seed data is committed at `packages/api/src/database/seeds/data/star-wars-catalog.json`. Re-scrape with `npm run scrape:star-wars` (requires `npx playwright install chromium` on first run — opens a browser window, ~3 minutes).

The 9 manually-curated 12" figures have `externalId: null` and `sourceUrl` pointing to thetoycollectorsguide.com. PostgreSQL null ≠ null in unique constraints, so they will re-insert on every seed run — acceptable for stable hand-curated data.
