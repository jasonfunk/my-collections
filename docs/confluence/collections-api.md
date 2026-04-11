---
confluence_page_id: "3833858"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3833858"
title: "My Collections — Collections API"
last_updated: "2026-04-10"
---

All Collections API endpoints require `Authorization: Bearer <access_token>` in the request header. Obtain tokens via the Authentication API.

## Common Fields

These base fields are present on every collection item regardless of type:

| **Field** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `id` | string (UUID) | _auto_ | Unique identifier |
| `name` | string | **yes** | Display name, e.g. "Luke Skywalker (X-Wing Pilot)" |
| `condition` | ConditionGrade | **yes** | Physical condition of the item |
| `packagingCondition` | PackagingCondition | **yes** | Condition of original packaging |
| `isOwned` | boolean | **yes** | true = owned, false = wishlist |
| `isComplete` | boolean | **yes** | All parts and accessories present |
| `acquisitionSource` | AcquisitionSource | _no_ | Where the item was acquired |
| `acquisitionDate` | string (ISO 8601) | _no_ | Date the item was acquired |
| `acquisitionPrice` | number | _no_ | Price paid (2 decimal precision) |
| `estimatedValue` | number | _no_ | Current market value estimate |
| `notes` | string | _no_ | Free-text notes |
| `photoUrls` | string\[\] | _no_ | Array of photo URLs |

All three collection-type list endpoints support these shared query filters in addition to their collection-specific params: `search` (case-insensitive substring match on name and notes), `acquisitionSource` (AcquisitionSource enum), `isComplete` (boolean — true = complete, false = incomplete).

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
  "starWars": { "owned": 42, "wishlist": 15, "estimatedTotalValue": 1250.00 },
  "transformers": { "owned": 28, "wishlist": 8, "estimatedTotalValue": 875.50 },
  "heman": { "owned": 35, "wishlist": 12, "estimatedTotalValue": null },
  "totals": { "owned": 105, "wishlist": 35, "estimatedTotalValue": 2125.50 }
}
```

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

The search merges results from all three tables in application memory, sorts by name, then paginates. This is appropriate for personal collection sizes (hundreds of items). The `collectionType` field on each returned item indicates which table it came from.

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
{ "url": "/uploads/1712345678901-123456789.jpg" }
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
| **Star Wars** | `GET /collections/star-wars/catalog`, `GET /collections/star-wars/catalog/:id` | `GET/POST /collections/star-wars/items`, `PATCH /collections/star-wars/items/:id`, `PATCH /collections/star-wars/items/:id/acquired`, `DELETE /collections/star-wars/items/:id` | `GET /collections/star-wars/wishlist` |
| **Transformers** | `GET /collections/transformers/catalog`, `GET /collections/transformers/catalog/:id` | `GET/POST /collections/transformers/items`, `PATCH /collections/transformers/items/:id`, `PATCH /collections/transformers/items/:id/acquired`, `DELETE /collections/transformers/items/:id` | `GET /collections/transformers/wishlist` |
| **He-Man** | `GET /collections/he-man/catalog`, `GET /collections/he-man/catalog/:id` | `GET/POST /collections/he-man/items`, `PATCH /collections/he-man/items/:id`, `PATCH /collections/he-man/items/:id/acquired`, `DELETE /collections/he-man/items/:id` | `GET /collections/he-man/wishlist` |

- My Collections — Star Wars Figures
- My Collections — G1 Transformers
- My Collections — Masters of the Universe
