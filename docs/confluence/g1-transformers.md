---
confluence_page_id: "4325377"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/4325377"
title: "My Collections — G1 Transformers"
last_updated: "2026-04-10"
---

Base URL: `/collections/transformers`. All endpoints require `Authorization: Bearer <access_token>`. Common fields (condition, photoUrls, etc.) are documented on the parent Collections API page.

## Data Model

G1 Transformers data is split across two tables to separate catalog knowledge from personal collection records:

- `g1_transformers_catalog` — What Hasbro/Takara made. Pre-populated reference data. Read-only via API. Includes name, faction, alt mode, accessories, and release details.
- `user_g1_transformers_items` — Your personal records. Each row links to a catalog entry and adds ownership data: condition, packaging, parts present, acquisition details, photos, notes, and wishlist priority.

## TransformersFaction Enum

- `AUTOBOT`
- `DECEPTICON`

## TransformersLine Enum

G1 series year. Note: the enum values use short codes (`G1_S1` through `G1_S6`).

- `G1_S1` — 1984 (Series 1)
- `G1_S2` — 1985 (Series 2)
- `G1_S3` — 1986 (Series 3 / Movie)
- `G1_S4` — 1987 (Series 4)
- `G1_S5` — 1988 (Series 5)
- `G1_S6` — 1989–1990 (Series 6)

## TransformerSize Enum

Physical size class. Mini vehicles and cassettes are MINI; large combiners and Fortress Maximus are JUMBO.

- `MINI` — Mini vehicles, cassettes (Soundwave's tapes, etc.)
- `SMALL` — Cars, smaller jets
- `MEDIUM` — Mid-size figures
- `LARGE` — Seekers, larger vehicles
- `JUMBO` — Combiners, Fortress Maximus

## Catalog Fields

Fields returned by `GET /collections/transformers/catalog` and `GET /collections/transformers/catalog/:id`:

| **Field** | **Type** | **Description** |
| --- | --- | --- |
| `id` | string (UUID) | Unique catalog entry ID |
| `name` | string | Figure name (e.g., "Optimus Prime") |
| `faction` | TransformersFaction | AUTOBOT or DECEPTICON |
| `line` | TransformersLine \| null | G1 series year (G1_S1–G1_S6) |
| `size` | TransformerSize \| null | Physical size class |
| `altMode` | string \| null | Vehicle or object alternate mode (e.g., "Porsche 911", "F-15 fighter jet") |
| `accessories` | string\[\] | All original accessories included |
| `catalogImageUrl` | string \| null | Reference image URL |
| `isVariant` | boolean | True if this is a production variant |
| `variantDescription` | string \| null | Variant details |
| `isCombiner` | boolean | Part of a combiner team |
| `combinerTeam` | string \| null | Team name (e.g., "Aerialbots", "Stunticons") |
| `isGiftSet` | boolean | Gift set release |
| `isMailaway` | boolean | Mail-away exclusive |
| `japaneseRelease` | boolean | Japanese market (Takara) version |
| `externalId` | string \| null | Source dataset ID |

## User Item Fields

These fields supplement the Common Fields defined on the parent Collections API page. Used with `POST /collections/transformers/items` and `PATCH /collections/transformers/items/:id`:

| **Field** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `catalogItemId` | string (UUID) | **yes** | ID of the catalog entry this item records |
| `isBoxed` | boolean | **yes** | Has original box |
| `hasInstructions` | boolean | **yes** | Instruction sheet present |
| `hasTechSpec` | boolean | **yes** | Tech spec card present |
| `ownedAccessories` | string\[\] | _no_ | Accessories you actually have (subset of catalog accessories) |
| `rubSign` | boolean | _no_ | Heat-sensitive rub sign sticker present |
| `wishlistPriority` | WishlistPriority | _no_ | LOW / MEDIUM / HIGH — only meaningful when isOwned = false |

## Endpoints

### Catalog (read-only)

- `GET /collections/transformers/catalog` — Browse the catalog. Query filters: `faction` (TransformersFaction), `line` (TransformersLine), `search` (case-insensitive name match), `page`, `limit`
- `GET /collections/transformers/catalog/:id` → 200 / 404

### User Items

- `GET /collections/transformers/items` — List your personal items (owned + wishlist). Query filters: `page`, `limit`
- `POST /collections/transformers/items` — Claim a catalog item (add to owned collection or wishlist) → 201 / 409 (already claimed)
- `PATCH /collections/transformers/items/:id` — Partial update → 200
- `PATCH /collections/transformers/items/:id/acquired` — Mark a wishlist item as acquired (sets isOwned=true) → 200
- `DELETE /collections/transformers/items/:id` → 204 / 404

### Wishlist

- `GET /collections/transformers/wishlist` — List wishlist items (isOwned=false) sorted by wishlistPriority. Query filters: `page`, `limit`
