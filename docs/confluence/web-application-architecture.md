---
confluence_page_id: "3899393"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3899393"
title: "My Collections — Web Application Architecture"
last_updated: "2026-05-25 (COL-110, COL-95)"
---

## Overview

React 18 SPA built with Vite 5. Deployed as static files to Dreamhost shared hosting. Communicates with the NestJS API at runtime via HTTP — there is no server-side rendering.

## Vite Dev Server Proxy

In development, Vite proxies `/api/*` requests to `http://localhost:3000` with path rewrite stripping the `/api` prefix. This means frontend calls `/api/auth/authorize` which arrives at NestJS as `/auth/authorize`. The NestJS API has no global `/api` prefix.

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

## React Router Routes

All routes are defined in `src/App.tsx`. The three collection types (star-wars, he-man, transformers) each have their own static catalog routes defined before the generic `/:collection` catch-all — React Router matches the most specific route first.

| **Path** | **Component** | **Auth** | **Description** |
| --- | --- | --- | --- |
| `/login` | LoginPage | No | OAuth2 login form |
| `/auth/callback` | CallbackPage | No | OAuth2 redirect callback handler |
| `/dashboard` | DashboardPage | Yes | Collection stats overview — owned count, catalog completion ring, wishlist count, estimated value per collection |
| `/search` | SearchPage | Yes | Cross-collection search; filter panel with collectionType, condition, owned/wishlist, completeness |
| `/wishlist` | WishlistPage | Yes | All wishlist items across all three collections |
| `/collections/star-wars` | StarWarsCatalogPage | Yes | Browse the pre-populated Kenner Star Wars catalog (199 items) |
| `/collections/star-wars/:id` | StarWarsCatalogDetailPage | Yes | Catalog item detail — claim as owned or add to wishlist |
| `/collections/he-man` | MastersCatalogPage | Yes | Browse the Masters of the Universe catalog |
| `/collections/he-man/:id` | MastersCatalogDetailPage | Yes | Catalog item detail — claim as owned or add to wishlist |
| `/collections/transformers` | TransformersCatalogPage | Yes | Browse the G1 Transformers catalog |
| `/collections/transformers/:id` | TransformersCatalogDetailPage | Yes | Catalog item detail — claim as owned or add to wishlist |
| `/collections/:collection/new` | CollectionFormPage | Yes | Add new item to any collection |
| `/collections/:collection/:id/edit` | CollectionFormPage | Yes | Edit an existing item |
| `/missing-accessories` | MissingAccessoriesPage | Yes | All owned items with at least one missing accessory, grouped by collection; PDF export |
| `/collections/:collection/:id` | CollectionDetailPage | Yes | Full personal item detail view |

## OAuth2 Integration

1. App navigates to `/login` — generates `code_verifier` (random, 43+ chars) and `code_challenge` (BASE64URL-SHA256)
2. Calls `GET /api/auth/authorize` with PKCE params to validate the client
3. Calls `POST /api/auth/login` with credentials + PKCE session — receives `redirectUrl`
4. Follows redirect to `/auth/callback?code=...&state=...`
5. `CallbackPage` calls `POST /api/auth/token` with code + verifier — receives tokens
6. Access token stored **in-memory only** (lost on page refresh); refresh token stored in `localStorage` under key `mc_rt`
7. `AuthContext` provides `user` state and `logout()` function app-wide; on page load it silently restores the session by calling `POST /auth/token` with the stored refresh token

## API Client (src/api/client.ts)

Typed native `fetch` wrapper — no Axios. Responsibilities:

- Prepends `/api` base path (proxied to NestJS in dev)
- Injects `Authorization: Bearer <token>` on every request using the in-memory access token
- On 401: silently refreshes tokens via the stored refresh token and retries the request once; logs out if refresh fails
- `uploadFile(path, file)` for multipart/form-data POSTs — no `Content-Type` header set (browser sets the multipart boundary automatically)

## Search and Filtering

All filter state lives in the URL via `useSearchParams` — filters survive page refresh and are shareable via URL.

- `FilterBar` (on per-collection list pages): text search, owned/wishlist toggle, completeness toggle, condition select, line/faction selects, acquisition source select. Search input is debounced 300 ms before writing to URL — prevents a fetch on every keystroke.
- `SearchPage` (`/search`): global cross-collection search. Calls `GET /collections/search` with params `q`, `collectionType`, `condition`, `isOwned`, `isComplete`. Also debounced 300 ms. Results shown in `ItemCard` grid; query disabled when `q` is empty.

## Add/Edit Forms

Both the create and edit flows render the same `CollectionFormPage` component:

- `/collections/:collection/new` — creates a new item (POST)
- `/collections/:collection/:id/edit` — edits an existing item (PATCH)
- Form state: controlled `useState` with patch-style `onChange(patch: Partial<FormData>)` props — no react-hook-form
- Validation: client-side required-field check before submit; server-side `class-validator` handles type/range validation
- Component split: `BaseFormFields` (fields common to all types) + `StarWarsFormFields` / `TransformersFormFields` / `MastersFormFields` (type-specific)
- Accessories editor: `accessories[]` = full list of original accessories; `ownedAccessories[]` = subset the collector owns; rendered as a checkbox list
- Photo upload widget: click → hidden `<input type="file">` → `POST /collections/photos/upload` → URL appended to `photoUrls[]`; thumbnails shown inline with remove buttons
- Mutations: `useMutation` POSTs (create) or PATCHes (edit); on success `invalidateQueries` for the list and `setQueryData` for the detail cache

## Catalog and Claim Flow

The main entry point for each collection is the catalog browse page (e.g., `/collections/star-wars`). Users browse what was manufactured, then claim items to add them to their personal collection:

- **Catalog pages** (`StarWarsCatalogPage`, `MastersCatalogPage`, `TransformersCatalogPage`): paginated grid of catalog items (50 per page, `DEFAULT_PAGE_SIZE`) with server-side search and filter. Each card shows the catalog image, name, faction/line, and a claim/wishlist button. Inline Prev/Next controls appear when there are multiple pages; `placeholderData: keepPreviousData` prevents flash between page transitions.
- **Catalog detail pages** (`StarWarsCatalogDetailPage`, etc.): full details for a single catalog entry — accessories list, variant info, and a dialog to claim as owned or add to wishlist.
- **Claim dialogs** (`StarWarsClaimDialog`, `TransformersClaimDialog`, `MastersClaimDialog`): modal form for setting initial condition, packaging, and owned accessories when claiming a catalog item.
- **Mark Acquired dialog** (`MarkAcquiredDialog`): converts a wishlist item to owned — updates `isOwned=true` via `PATCH /items/:id/acquired`, optionally setting condition and acquisition details.

## State and Data Fetching

- **TanStack Query v5** manages all server state (collections data, user profile)
- `useQuery` for reads, `useMutation` for creates, updates, and deletes
- Query keys scoped by collection type and item ID; paginated queries include the current page number in the key
- `placeholderData: keepPreviousData` on all paginated queries — shows stale data while the next page loads, preventing blank-screen flicker between pages
- Page size constants defined in `src/lib/collectionConfig.ts`: `DEFAULT_PAGE_SIZE = 50` (catalog browse), `WISHLIST_PAGE_SIZE = 50` (wishlist sections), `MAX_USER_ITEMS_FETCH = 500` (intentional full-load for owned/wishlist overlay maps on catalog pages)
- Access token injected by the `src/api/client.ts` fetch wrapper on every request

## UI Components

- **Tailwind CSS v4** — utility-first styling
- **Radix UI** — headless components (Dialog, Select, Toggle, etc.)
- **shadcn/ui** — component patterns (Button, Badge, Card, Table, Input, Label, Textarea, Checkbox, Skeleton, Separator)
- **Lucide React** — icon set

**Shared UI components** (under `src/components/ui/`):

- `CollectionIcon` — custom SVG icons for each collection (Star Wars, Transformers, He-Man)
- `CollectionProgressIcon` — wraps `CollectionIcon` with an animated SVG progress ring; ring fills proportionally to `owned / catalogTotal` in the collection's accent color (amber/blue/purple) with a matching glow; percentage label rendered below the icon; animates from 0 on mount

**Collection-specific components** (under `src/components/collections/`):

- `StarWarsCatalogCard`, `TransformersCatalogCard`, `MastersCatalogCard` — catalog item grid cards
- `StarWarsClaimDialog`, `TransformersClaimDialog`, `MastersClaimDialog` — claim/wishlist modal forms
- `MarkAcquiredDialog` — convert wishlist item to owned
- `WishlistPdfDocument` — React-PDF document for wishlist export; includes lightweight markdown renderer
- `MissingAccessoriesPdfDocument` — React-PDF document for missing accessories export; list layout (full-width rows with MISSING/HAVE labels)
- `ItemCard`, `ItemTable` — personal item list views (grid and table)
- `ConditionBadge` — color-coded condition grade indicator
- `FilterBar` — filter/search controls for list pages
- `AccessoriesList` — owned vs. missing accessories display

## Wishlist PDF Export (COL-109)

A "Download PDF" button on the wishlist page generates a printable hunting list — intended as a gift guide for family members.

**Flow:** Button click → lazy-fetch all wishlist items (up to 500 per collection via `MAX_USER_ITEMS_FETCH`) → `pdf().toBlob()` → programmatic `<a download>` → browser saves file.

**Library:** `@react-pdf/renderer` v4 (browser-side, no server round-trip). Uses the `pdf()` programmatic API rather than `PDFDownloadLink` to control the loading spinner and exact download timing.

**Filename format:** `jason-wishlist-YYYYMMDD.pdf`

**Document layout (Letter size):**
- Fixed page header: title + generation date, repeated on every page
- Guidance block (page 1): formatted collector's note rendered from `src/assets/wishlist-guidance.md` (versioned in git, editable via GitHub PR without code changes)
- Collection sections (Star Wars / Transformers / He-Man) — only sections with items are included
- 2-column item grid: thumbnail (56×56px from `catalog.catalogImageUrl`) + priority label + name + year/line/metadata + accessories list + user notes
- Fixed footer: "Page N of M" + date, repeated on every page

**Guidance markdown:** `src/assets/wishlist-guidance.md` is imported at build time via Vite's `?raw` suffix. A lightweight line-by-line renderer converts it to React-PDF elements supporting `# H1`, `## H2`, `- bullets`, `**bold**`, and `*italic*`. To update the guidance text, edit the file and commit — no code change needed. The `*.md?raw` module type is declared in `src/vite-env.d.ts`.

**Image handling:** `catalog.catalogImageUrl` is a root-relative path (e.g. `/catalog-images/star-wars/filename.jpg`) served from `public/catalog-images/`. React-PDF requires absolute URLs, so paths are normalized: `url.startsWith('http') ? url : window.location.origin + url`. Items with no image get a gray placeholder box.

**Key files:**
- `src/components/collections/WishlistPdfDocument.tsx` — React-PDF document component + markdown renderer
- `src/assets/wishlist-guidance.md` — collector's guidance note (editable content)
- `src/pages/WishlistPage.tsx` — Download PDF button, lazy all-items queries, blob download trigger

## Missing Accessories PDF Export (COL-110)

A "Download PDF" button on the `/missing-accessories` page generates a printable parts-hunting list showing every owned item that is missing at least one catalog accessory.

**How items are selected:** No dedicated API endpoint. Fetches all items per collection via `GET /collections/{type}/items?limit=500`, then filters client-side: `isOwned === true && catalog.accessories.length > 0 && at least one accessory not in ownedAccessories`.

**Flow:** Same as wishlist PDF — button click → fetch all items (using cached data if available) → `pdf().toBlob()` → programmatic `<a download>`.

**Filename format:** `missing-accessories-YYYYMMDD.pdf`

**Document layout (Letter size):**
- Fixed page header and footer (same structure as wishlist PDF)
- Guidance block: rendered from `src/assets/missing-accessories-guidance.md`
- Collection sections (Star Wars / Transformers / He-Man) — only sections with missing-accessory items are included
- Full-width item rows (list layout, not 2-column grid): item name + meta line + `MISSING: X, Y` in amber + `HAVE: Z` in green + user notes in italic

**Layout rationale:** Accessory names can be long (e.g., "Dragon Backpack (front)"). A list row reads more clearly than a thumbnail card for this use case.

**Key files:**
- `src/components/collections/MissingAccessoriesPdfDocument.tsx` — React-PDF document component
- `src/assets/missing-accessories-guidance.md` — guidance note (editable content)
- `src/pages/MissingAccessoriesPage.tsx` — page component with three per-collection queries, client-side filter, and blob download trigger

**Bug fix (same PR):** All three claim dialogs (`StarWarsClaimDialog`, `TransformersClaimDialog`, `MastersClaimDialog`) were unconditionally sending `catalogId` in `buildDto()`. On a PATCH (edit), the update DTOs reject `catalogId` via NestJS `whitelist: true`. Fixed to spread `catalogId` only when `!existing` (create mode).

## Error Monitoring (COL-95)

**Library:** `@sentry/react` v9.

**Initialization:** `Sentry.init()` is called in `src/main.tsx` before the React render. Configuration:

- `dsn`: read from `import.meta.env.VITE_SENTRY_DSN` (baked in at build time by Vite)
- `environment`: set to `import.meta.env.MODE` (`"development"` in dev server, `"production"` in builds)
- `integrations`: `browserTracingIntegration()` for automatic performance spans
- `tracesSampleRate`: `0.1` in production, `1.0` in development
- `enabled`: `false` when `VITE_SENTRY_DSN` is unset — Sentry is completely silent locally unless the env var is present

**ErrorBoundary integration:** `src/components/ErrorBoundary.tsx` calls `Sentry.captureException(error, { contexts: { react: { componentStack } } })` in `componentDidCatch` so React render errors reach Sentry before showing the fallback UI.

**Source maps:** `@sentry/vite-plugin` is registered in `vite.config.ts` after all other plugins. `build.sourcemap: 'hidden'` generates `.map` files without `//# sourceMappingURL` comments in the JS output (so they aren't publicly accessible). The plugin uploads them to Sentry during CI builds and deletes them from `dist/` afterward. Requires `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` env vars — no-op when `SENTRY_AUTH_TOKEN` is absent (e.g. local builds).

**Local dev:** Add `VITE_SENTRY_DSN=<dsn>` to `packages/web/.env.local` to enable Sentry in the dev server. This file is gitignored.

## Known Quirks

- `@my-collections/shared` compiles to CommonJS for NestJS compatibility. Vite requires `optimizeDeps.include: ['@my-collections/shared']` to pre-bundle it as ESM — otherwise enum _values_ (not just types) fail to resolve at runtime.
- All React hooks (`useQuery`, `useParams`, etc.) must be called before any early `return` in a component. Use `enabled: !!param` to disable queries when params are missing rather than returning early before the hook.
- The in-memory access token is cleared on a hard page refresh. `AuthContext` restores it silently on mount via the `localStorage` refresh token, but `ProtectedRoute` redirects to `/login` during that async restore — this is expected behavior, not a bug.
- **shadcn/ui Select (Radix combobox):** `browser_select_option` (Playwright) fails on Radix UI comboboxes. Use click-trigger → click-option pattern instead. Standard `<select>` elements work normally.
- Static collection routes (`/collections/star-wars`, etc.) must be defined before the generic `/collections/:collection` route in `App.tsx` to prevent React Router from matching the collection slug as a `:collection` param.
