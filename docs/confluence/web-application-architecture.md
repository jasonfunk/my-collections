---
confluence_page_id: "3899393"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3899393"
title: "My Collections — Web Application Architecture"
last_updated: "2026-04-19"
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
| `/dashboard` | DashboardPage | Yes | Collection stats overview (owned count, wishlist count, estimated value per collection) |
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

**Collection-specific components** (under `src/components/collections/`):

- `StarWarsCatalogCard`, `TransformersCatalogCard`, `MastersCatalogCard` — catalog item grid cards
- `StarWarsClaimDialog`, `TransformersClaimDialog`, `MastersClaimDialog` — claim/wishlist modal forms
- `MarkAcquiredDialog` — convert wishlist item to owned
- `ItemCard`, `ItemTable` — personal item list views (grid and table)
- `ConditionBadge` — color-coded condition grade indicator
- `FilterBar` — filter/search controls for list pages
- `AccessoriesList` — owned vs. missing accessories display

## Known Quirks

- `@my-collections/shared` compiles to CommonJS for NestJS compatibility. Vite requires `optimizeDeps.include: ['@my-collections/shared']` to pre-bundle it as ESM — otherwise enum _values_ (not just types) fail to resolve at runtime.
- All React hooks (`useQuery`, `useParams`, etc.) must be called before any early `return` in a component. Use `enabled: !!param` to disable queries when params are missing rather than returning early before the hook.
- The in-memory access token is cleared on a hard page refresh. `AuthContext` restores it silently on mount via the `localStorage` refresh token, but `ProtectedRoute` redirects to `/login` during that async restore — this is expected behavior, not a bug.
- **shadcn/ui Select (Radix combobox):** `browser_select_option` (Playwright) fails on Radix UI comboboxes. Use click-trigger → click-option pattern instead. Standard `<select>` elements work normally.
- Static collection routes (`/collections/star-wars`, etc.) must be defined before the generic `/collections/:collection` route in `App.tsx` to prevent React Router from matching the collection slug as a `:collection` param.
