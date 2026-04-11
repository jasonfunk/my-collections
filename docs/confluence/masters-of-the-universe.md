---
confluence_page_id: "4358146"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/4358146"
title: "My Collections — Masters of the Universe"
last_updated: "2026-04-10"
---

Base URL: `/collections/he-man`. All endpoints require `Authorization: Bearer <access_token>`. Common fields (condition, photoUrls, etc.) are documented on the parent Collections API page.

## Data Model

Masters of the Universe data is split across two tables to separate catalog knowledge from personal collection records:

- `masters_catalog` — What Mattel made. Pre-populated reference data. Read-only via API. Includes name, character type, line, mini-comic, action features, and accessories.
- `user_masters_items` — Your personal records. Each row links to a catalog entry and adds ownership data: condition, packaging, parts present, acquisition details, photos, notes, and wishlist priority.

## MastersLine Enum

- `ORIGINAL` — Core 1981–1988 He-Man line
- `POP` — She-Ra: Princess of Power
- `GOLDEN_BOOKS` — Golden Books tie-in releases
- `MINI` — Mini figures

## MastersCharacterType Enum

Character alignment within the story. Useful for filtering by "heroic warriors" vs. "evil warriors."

- `HEROIC` — Heroic Warriors (He-Man's side)
- `EVIL` — Evil Warriors (Skeletor's side)
- `HEROIC_ALLY` — Heroic allies and allies of good
- `EVIL_ALLY` — Evil allies and monsters
- `NEUTRAL` — Neutral characters

## Catalog Fields

Fields returned by `GET /collections/he-man/catalog` and `GET /collections/he-man/catalog/:id`:

| **Field** | **Type** | **Description** |
| --- | --- | --- |
| `id` | string (UUID) | Unique catalog entry ID |
| `name` | string | Character/item name (e.g., "He-Man", "Skeletor") |
| `line` | MastersLine \| null | Product line (ORIGINAL, POP, MINI, etc.) |
| `characterType` | MastersCharacterType \| null | Character alignment |
| `releaseYear` | number \| null | Year first released (1981–1990) |
| `accessories` | string\[\] | All original accessories included |
| `catalogImageUrl` | string \| null | Reference image URL |
| `isVariant` | boolean | True if this is a production variant |
| `variantDescription` | string \| null | Variant details (e.g., "first release", "cross sell back") |
| `miniComic` | string \| null | Title of the included mini-comic |
| `hasArmorOrFeature` | boolean | Has battle armor or special action feature |
| `featureDescription` | string \| null | Description of the action feature (e.g., "Battle Armor") |
| `externalId` | string \| null | Source dataset ID |

## User Item Fields

These fields supplement the Common Fields defined on the parent Collections API page. Used with `POST /collections/he-man/items` and `PATCH /collections/he-man/items/:id`:

| **Field** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `catalogItemId` | string (UUID) | **yes** | ID of the catalog entry this item records |
| `isCarded` | boolean | **yes** | Still on original card |
| `hasBackCard` | boolean | **yes** | Mini-comic / back card intact |
| `ownedAccessories` | string\[\] | _no_ | Accessories you actually have (subset of catalog accessories) |
| `wishlistPriority` | WishlistPriority | _no_ | LOW / MEDIUM / HIGH — only meaningful when isOwned = false |

## Endpoints

### Catalog (read-only)

- `GET /collections/he-man/catalog` — Browse the catalog. Query filters: `line` (MastersLine), `characterType` (MastersCharacterType), `search` (case-insensitive name match), `page`, `limit`
- `GET /collections/he-man/catalog/:id` → 200 / 404

### User Items

- `GET /collections/he-man/items` — List your personal items (owned + wishlist). Query filters: `page`, `limit`
- `POST /collections/he-man/items` — Claim a catalog item (add to owned collection or wishlist) → 201 / 409 (already claimed)
- `PATCH /collections/he-man/items/:id` — Partial update → 200
- `PATCH /collections/he-man/items/:id/acquired` — Mark a wishlist item as acquired (sets isOwned=true) → 200
- `DELETE /collections/he-man/items/:id` → 204 / 404

### Wishlist

- `GET /collections/he-man/wishlist` — List wishlist items (isOwned=false) sorted by wishlistPriority. Query filters: `page`, `limit`
