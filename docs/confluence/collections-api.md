---
confluence_page_id: "3833858"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3833858"
title: "My Collections — Collections API"
last_updated: "2026-04-25"
---

All Collections API endpoints require `Authorization: Bearer <access_token>` in the request header. Obtain tokens via the Authentication API.

## Data Model

All three collection types follow a two-table pattern:

- **Catalog table** — pre-populated reference data scraped from transformerland.com. Shared across all users. Contains the canonical name, expected accessories, images, variant info, and collection-specific fields. Read-only from the user's perspective.
- **User items table** — personal collection records. Linked to a catalog entry via `catalogId`. Contains ownership status, condition, acquisition details, wishlist priority, personal photos, and notes.

Seed data: 199 Star Wars, 443 G1 Transformers, 127 He-Man = **769 total catalog records**.

## Common User Item Fields

These fields are present on every user item record regardless of collection type:

| **Field** | **Type** | **Notes** |
| --- | --- | --- |
| `id` | string (UUID) | User item record ID |
| `catalogId` | string (UUID) | FK to catalog entry |
| `catalog` | object | Embedded catalog data (hydrated on reads) |
| `isOwned` | boolean | true = owned, false = on wishlist |
| `wishlistPriority` | WishlistPriority | Nullable — meaningful only when `!isOwned` |
| `condition` | ConditionGrade | Nullable |
| `packagingCondition` | PackagingCondition | Nullable |
| `isComplete` | boolean | All accessories present |
| `ownedAccessories` | string[] | Subset of catalog accessories actually owned |
| `acquisitionSource` | AcquisitionSource | Nullable |
| `acquisitionDate` | string (ISO 8601) | Nullable |
| `acquisitionPrice` | number | Nullable, 2 decimal precision |
| `estimatedValue` | number | Nullable |
| `notes` | string | Nullable |
| `photoUrls` | string[] | Personal photos (distinct from catalog image) |

### ConditionGrade Enum

- `C10` — Mint
- `C9` — Near Mint
- `C8` — Excellent
- `C7` — Fine
- `C6` — Very Good
- `C5` — Good
- `C4` — Poor
- `INC` — Incomplete

### PackagingCondition Enum

- `SEALED`
- `COMPLETE`
- `GOOD`
- `FAIR`
- `POOR`
- `NONE`

### AcquisitionSource Enum

- `ORIGINAL`
- `EBAY`
- `ETSY`
- `FLEA_MARKET`
- `ANTIQUE_STORE`
- `CONVENTION`
- `PRIVATE_SALE`
- `TRADE`
- `GIFT`
- `TOY_STORE`
- `OTHER`

### WishlistPriority Enum

Used on user item records where `isOwned = false`. Allows sorting and filtering the wishlist by priority level.

- `HIGH`
- `MEDIUM`
- `LOW`

---

## GET /collections/stats

```http
GET /collections/stats
```

Returns summary statistics across all collection types.

```json
{
  "starWars": { "owned": 42, "wishlist": 15, "estimatedTotalValue": 1250.00, "catalogTotal": 199 },
  "transformers": { "owned": 28, "wishlist": 8, "estimatedTotalValue": 875.50, "catalogTotal": 118 },
  "heman": { "owned": 35, "wishlist": 12, "estimatedTotalValue": null, "catalogTotal": 62 },
  "totals": { "owned": 105, "wishlist": 35, "estimatedTotalValue": 2125.50 }
}
```

`catalogTotal` — total number of entries in that collection's pre-seeded catalog (used to compute completion percentage on the dashboard).

---

## GET /collections/recent

```http
GET /collections/recent?limit=5
```

Returns the most recently added user items across all three collection types, sorted by creation date descending. Useful for dashboard "recently added" widgets.

| **Param** | **Type** | **Description** |
| --- | --- | --- |
| `limit` | number | Max items to return (default 5, max 20) |

**Response — array of `RecentCollectionItem`:**

```json
[
  {
    "id": "d4f8...",
    "name": "Optimus Prime",
    "collectionType": "TRANSFORMERS",
    "isOwned": true,
    "condition": "C8",
    "createdAt": "2026-04-10T14:23:00.000Z"
  }
]
```

`collectionType` is `STAR_WARS`, `TRANSFORMERS`, or `HE_MAN`. `condition` is a `ConditionGrade` value (nullable — omitted if not set). Results are merged across all three user-items tables and re-sorted by `createdAt` after the per-table queries.

---

## GET /collections/search

```http
GET /collections/search?q=optimus&collectionType=TRANSFORMERS&condition=C9&isOwned=true&isComplete=true&page=1&limit=20
```

Global free-text search across all three collection tables simultaneously. Returns a unified paginated list sorted by name.

| **Param** | **Type** | **Description** |
| --- | --- | --- |
| `q` | string | Case-insensitive substring match on name and notes |
| `collectionType` | CollectionType | Limit to STAR_WARS, TRANSFORMERS, or HE_MAN |
| `condition` | ConditionGrade | Filter by condition grade |
| `isOwned` | boolean | true = owned, false = wishlist |
| `isComplete` | boolean | true = complete only, false = incomplete only |
| `page` | number | Page number (1-based, default 1) |
| `limit` | number | Items per page (max 100, default 20) |

The search runs DB-level queries across all three user items tables with server-side pagination. The `collectionType` field on each returned item indicates which collection it came from.

---

## Photo Upload — /collections/photos/upload

Upload an image file for a collection item. Returns a URL that can be stored in the `photoUrls` array on any item. Auth required.

```http
POST /collections/photos/upload
Content-Type: multipart/form-data
```

| **Field** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `file` | File | **yes** | Image file (JPEG, PNG, WebP, or GIF — max 10 MB) |

### Response 201

```json
{ "url": "/collections/photos/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4.jpg" }
```

### Errors

- **400** — no file provided, or file type not allowed
- **401** — missing / expired token
- **413** — file exceeds 10 MB limit

Store the returned URL in the `photoUrls` array when creating or patching a collection item. Files are served as static assets at the same URL path.

---

## Collection-Type Endpoints

All three collection types follow the same pattern: a shared read-only catalog of what was made, plus personal user item records linked to catalog entries. See the child pages for full field definitions and enum details.

| **Collection** | **Catalog Endpoints** | **User Item Endpoints** | **Wishlist** |
| --- | --- | --- | --- |
| **Star Wars** | `GET /collections/star-wars/catalog`, `GET /collections/star-wars/catalog/:id` | `GET/POST /collections/star-wars/items`, `GET /collections/star-wars/items/:id`, `PATCH /collections/star-wars/items/:id`, `PATCH /collections/star-wars/items/:id/acquired`, `DELETE /collections/star-wars/items/:id` | `GET /collections/star-wars/wishlist` |
| **Transformers** | `GET /collections/transformers/catalog`, `GET /collections/transformers/catalog/:id` | `GET/POST /collections/transformers/items`, `GET /collections/transformers/items/:id`, `PATCH /collections/transformers/items/:id`, `PATCH /collections/transformers/items/:id/acquired`, `DELETE /collections/transformers/items/:id` | `GET /collections/transformers/wishlist` |
| **He-Man** | `GET /collections/he-man/catalog`, `GET /collections/he-man/catalog/:id` | `GET/POST /collections/he-man/items`, `GET /collections/he-man/items/:id`, `PATCH /collections/he-man/items/:id`, `PATCH /collections/he-man/items/:id/acquired`, `DELETE /collections/he-man/items/:id` | `GET /collections/he-man/wishlist` |

- My Collections — Star Wars Figures
- My Collections — G1 Transformers
- My Collections — Masters of the Universe
