---
confluence_page_id: "9535489"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/9535489"
title: "My Collections — Mobile Application Architecture"
last_updated: "2026-04-19"
---

## Overview

Expo 55 / React Native 0.83.4 mobile app. Android is the primary target; iOS is secondary. Single codebase for both platforms. Uses Expo Router (file-based routing, like Next.js `app/` but for React Native), OAuth2 PKCE auth with `expo-secure-store` token storage, and Maestro for UI smoke tests.

**Dev server:** `npm run dev --workspace=packages/mobile` (starts Expo Metro bundler).
**Android emulator:** `npm run android --workspace=packages/mobile`.
**Environment variable:** `EXPO_PUBLIC_API_BASE_URL` — set in `packages/mobile/.env` for local dev (e.g. `http://10.0.2.2:3000` for Android emulator localhost alias).

## Route Structure

Expo Router maps files in `app/` to routes. Route groups (folder names in parentheses) share a layout but the folder name is stripped from the URL path.

| File | Route | Description |
| --- | --- | --- |
| `app/_layout.tsx` | (root) | Wraps entire app in `AuthProvider`. No nav chrome. |
| `app/(auth)/_layout.tsx` | (auth group) | Stack navigator for auth screens. |
| `app/(auth)/login.tsx` | `/login` (effectively) | Email/password login form. |
| `app/(app)/_layout.tsx` | (app group) | Protected layout. Redirects to `/(auth)/login` if not authenticated. Renders bottom tab bar. |
| `app/(app)/index.tsx` | `/` | Dashboard — collection stats cards, totals, recently added. |
| `app/(app)/collections/_layout.tsx` | (collections stack) | Stack navigator for drill-down within Collections tab. |
| `app/(app)/collections/index.tsx` | `/collections` | Collection picker — three tappable cards navigating to browse. |
| `app/(app)/collections/[collection].tsx` | `/collections/:slug` | Browse screen — scrollable item list for one collection. |
| `app/(app)/collections/[collection]/[id].tsx` | `/collections/:slug/:id` | Item detail screen — condition, accessories, acquisition info, notes, photos. |
| `app/(app)/wishlist.tsx` | `/wishlist` | Wishlist tab. |
| `app/(app)/search.tsx` | `/search` | Search tab. |

### Key Expo Router concepts

- **`_layout.tsx`** — the layout wrapper for all siblings/children in the same folder. Like a React Router `<Outlet>` parent — it renders its children via `<Stack>`, `<Tabs>`, or `<Slot>`.
- **`(group)` folders** — parentheses signal a route group. The folder name is ignored for URL purposes; it only organizes layouts.
- **`<Stack>`** — push/pop navigator. Used for drill-down flows (e.g., Collections → item detail).
- **`<Tabs>`** — bottom tab bar navigator. The `(app)` layout renders this for all authenticated screens.
- **`<Redirect>`** — declarative navigation. Used in `(app)/_layout.tsx` to kick unauthenticated users to login.

## Auth Flow

The mobile app uses the same OAuth2 Authorization Code Flow with PKCE as the web app, with two key differences:

1. **No cookies.** The `mobile-app` OAuth client receives the refresh token in the `POST /auth/token` response body (not as an httpOnly cookie). The `refreshToken` field is populated in the response when `clientId` is `mobile-app`.
2. **SecureStore instead of localStorage.** The refresh token is stored in `expo-secure-store` (the device's encrypted keychain). The access token is held in memory only.

### Login steps (AuthContext.tsx)

1. **`GET /auth/authorize`** — validates the OAuth client, returns session params (codeChallenge, scopes, state).
2. **`POST /auth/login`** — submits credentials + session params → returns a `redirectUrl` containing the authorization code.
3. Parse `code` and `state` from the redirect URL. Verify `state` matches the one generated in step 1 (CSRF protection).
4. **`POST /auth/token`** (authorization_code grant) — exchanges code + PKCE verifier for `{ accessToken, refreshToken }`. Both are returned in the response body.
5. Store access token in memory, refresh token in SecureStore.
6. **`GET /users/me`** — loads the user profile into context.

### Session restore (on app launch)

1. Read refresh token from SecureStore.
2. `POST /auth/token` with `refresh_token` grant — obtains a new access token. Server rotates the refresh token; store the new one.
3. `GET /users/me` — load profile. If any step fails, clear all tokens and show the login screen.

### Logout

Clear tokens from memory and SecureStore, reset `user` to `null` (triggers redirect to login), then fire `POST /auth/revoke` in the background to invalidate the refresh token on the server.

## API Client (`src/api/client.ts`)

Typed `fetch` wrapper. Key behaviours:

- Reads `EXPO_PUBLIC_API_BASE_URL` at module load time.
- Injects `Authorization: Bearer <token>` on every request using the in-memory access token.
- On 401: attempts one silent token refresh, deduplicating concurrent refresh calls via a shared promise, then retries the original request. If refresh fails, calls `logout()`.
- Exports `apiClient.get<T>()`, `.post<T>()`, `.patch<T>()`, `.delete()`.

`AuthContext` registers `refreshTokens` and `logout` callbacks with the client on mount via `registerAuthCallbacks()` — this avoids a circular import while keeping the client decoupled from React.

## Token Storage (`src/auth/tokenStorage.ts`)

| Token | Storage | Survives app restart? |
| --- | --- | --- |
| Access token | In-memory (`let _accessToken`) | No — cleared on close |
| Refresh token | `expo-secure-store` (device keychain) | Yes |

The access token is never written to disk. The refresh token is stored under key `mc_refresh_token` using `SecureStore.setItemAsync`.

## PKCE (`src/auth/pkce.ts`)

Uses `expo-crypto` instead of `window.crypto.subtle` (not available in React Native):

- `generateCodeVerifier()` — `Crypto.getRandomValues(new Uint8Array(96))` → base64url-encoded string (128 chars).
- `generateCodeChallenge(verifier)` — `Crypto.digestStringAsync(SHA256, verifier, BASE64)` → base64url-encoded SHA-256 hash.

## Dashboard Screen (`app/(app)/index.tsx`)

The dashboard makes two parallel API calls on mount and on pull-to-refresh:

- `GET /collections/stats` — returns owned/wishlist counts and estimated total value per collection type. Rendered as three tappable collection cards (Star Wars/amber, Transformers/blue, He-Man/purple) and a totals row.
- `GET /collections/recent?limit=5` — returns the 5 most recently added user items across all collections. Rendered as a "Recently Added" list with collection badge, owned/wishlist tag, and date.

Each collection card shows the collection icon (36 px, from `src/components/CollectionIcon.tsx`) alongside the collection name and a subtitle ("Original Trilogy · 1977–1985", "Generation 1 · 1984–1990", "Masters of the Universe · 1981–1988"). Icons are SVG components built with `react-native-svg`, ported from the web's `collection-icons.tsx`.

The login screen shows a `FaviconIcon` (amber person figure, 64 px) centered above the app title.

Tapping a collection card calls `router.navigate('/(app)/collections/star-wars')` (or `transformers` / `he-man`) to navigate directly to that collection's browse screen. Uses `router.navigate` (not `router.push`) — `push` creates a stack entry inside the tab navigator that corrupts subsequent tab-switching state.

Loading state shows a centered `ActivityIndicator`; the header and all content only render after both API calls resolve. Pull-to-refresh via `ScrollView` + `RefreshControl`.

## Collection Picker (`app/(app)/collections/index.tsx`)

Shown when the Collections tab is tapped. Three tappable cards — one per collection — navigate to `/(app)/collections/<slug>`. Card style matches the dashboard. Collection display metadata (label, accent color, subtitle, slug) comes from `src/config/collections.ts`.

## Browse Screen (`app/(app)/collections/[collection].tsx`)

Per-collection item list. The `collection` route parameter is a slug (`star-wars`, `transformers`, `he-man`); `SLUG_TO_COLLECTION` maps it to a `CollectionType` for the API call.

- **Data:** `collectionsService.fetchItems(collectionType)` → `GET /collections/<slug>/items?page=1&limit=50`
- **List:** `FlatList` with `RefreshControl` (pull-to-refresh). Each row shows catalog name, condition grade (if present), estimated value (if present), and an owned/wishlist badge.
- **Filter:** Filter button in the Stack header (Ionicons `options-outline`, indigo dot when active) opens `FilterSheet`. Filtering is client-side — `isOwned` boolean drives owned/wishlist split.
- **Navigation:** Tapping a row pushes `/(app)/collections/<slug>/<id>` (item detail screen).
- **Item count:** Rendered in a plain `View` above the `FlatList` — not in `ListHeaderComponent`, which is unreliable in Android's accessibility tree.

## Item Detail Screen (`app/(app)/collections/[collection]/[id].tsx`)

Full read-only detail view for a single user item. Fetches via `collectionsService.fetchItemDetail` → `GET /collections/<slug>/items/:id`. Renders a `ScrollView` with labelled card sections:

- **Status header** — catalog name (large), Owned/Wishlist badge, wishlist priority chip (High/Medium/Low) if on wishlist.
- **Condition** — figure grade (human label e.g. "C9 · Near Mint"), packaging condition, completeness.
- **Details** — collection-specific fields branched on `SLUG_TO_COLLECTION[slug]`:
  - Star Wars: Carded, Boxed
  - Transformers: Boxed, Instructions, Tech Spec, Rub Sign
  - He-Man: Carded, Back Card
  - All: owned accessories list with catalog accessory checklist (green = owned, gray = missing).
- **Acquisition** — source, date, price paid, estimated value. Section hidden if all null.
- **Notes** — free-text. Section hidden if null.
- **Photos** — horizontal `ScrollView` of `Image` thumbnails. Section hidden if no URLs.

`Stack.Screen` title is set dynamically to `catalog.name` once loaded. Loading/error/retry states match the browse screen pattern.

### `src/config/collections.ts`

Single source of truth for collection display config. `COLLECTION_CONFIG` maps `CollectionType` → `{ label, color, subtitle, slug }`. `SLUG_TO_COLLECTION` is the reverse map (slug string → `CollectionType`). Both dashboard and browse screen import from here.

### `src/services/collectionsService.ts`

Exports two fetch functions and their types:

- **`BrowseItem` / `fetchItems(collectionType, page, limit)`** — lightweight list shape (`id`, `catalog?.name`, `isOwned`, `condition?: string | null`, `estimatedValue?: number | null`). Used by the browse screen.
- **`DetailItem` / `fetchItemDetail(collectionType, id)`** — full item shape. Superset covering all three collection types; collection-specific fields are optional. Includes: `condition`, `packagingCondition`, `isComplete`, `ownedAccessories[]`, `isCarded`, `isBoxed`, `hasBackCard`, `hasInstructions`, `hasTechSpec`, `rubSign`, `acquisitionSource`, `acquisitionDate`, `acquisitionPrice`, `estimatedValue`, `notes`, `photoUrls[]`, and nested `catalog` with `name` and `accessories[]`. Used by the detail screen.

Note: nullable DB columns return `null` (not `undefined`) from TypeORM. Guards must use `!= null`.

### `src/components/FilterSheet.tsx`

Slide-up filter modal built with `Modal` + `Animated.Value` (no new package dependencies). Exports `BrowseFilters` type and `FilterSheet` component. Animates in from the bottom with a dimmed backdrop; Apply and Reset buttons; closes on backdrop tap or Apply.

## Testing

Maestro UI test suite at `packages/mobile/.maestro/`. Requires Maestro CLI and a running Android emulator.

```bash
JAVA_HOME=/Users/jfunk/.gradle/jdks/eclipse_adoptium-17-aarch64-os_x.2/jdk-17.0.18+8/Contents/Home \
~/.maestro/bin/maestro test packages/mobile/.maestro/smoke-test.yaml
```

Neither `maestro` nor `JAVA_HOME` are on Claude Code's default PATH — use the full paths above. The Gradle-downloaded JDK (`eclipse_adoptium-17`) is the reliable choice; `$(/usr/libexec/java_home)` returns empty in Claude Code's shell.

Individual test flows:

| File | Purpose |
| --- | --- |
| `smoke-test.yaml` | Full end-to-end orchestrator (5 flows) |
| `auth/login.yaml` | Clear state → launch → login → assert dashboard (cold start ~30s for PKCE + 2 API calls) |
| `auth/logout.yaml` | Tap Sign Out → assert login screen |
| `dashboard/stats.yaml` | Assert 3 collection cards + Totals; tap Star Wars card → assert browse loads; return to Dashboard |
| `navigation/tabs.yaml` | Cycle all four tabs; assert placeholder content on Wishlist/Search |
| `collections/item-detail.yaml` | Dashboard → Star Wars browse → tap item → assert Condition + Details sections → back |

## Known Quirks

- **Android emulator localhost alias:** The emulator's `10.0.2.2` maps to the host machine's `localhost`. Set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000` in `packages/mobile/.env` to hit the local API.
- **`expo prebuild --clean` resets Gradle config:** After running this command, re-apply the `java.home` Gradle property and verify `JAVA_HOME`/`ANDROID_HOME` in `~/.zshrc`. See the Android Build Environment memory note.
- **Maestro `JAVA_HOME` + binary path:** Claude Code does not inherit `~/.zshrc`, so `maestro` is not on PATH and `JAVA_HOME` is unset. Always invoke as: `JAVA_HOME=/Users/jfunk/.gradle/jdks/eclipse_adoptium-17-aarch64-os_x.2/jdk-17.0.18+8/Contents/Home ~/.maestro/bin/maestro test ...`. The Gradle-downloaded JDK is the reliable choice — the Android Studio JDK path in zshrc is not visible to Claude Code.
- **Maestro `extendedWaitUntil` uses exact text matching:** `visible: "items"` will NOT match the rendered text "2 items". Must use the exact full string (e.g. `visible: "2 items"`). `assertVisible` is more lenient (substring), but `extendedWaitUntil` is strict.
- **Maestro Android back navigation:** The Stack header back button on Android is an arrow icon with no text label — `tapOn: "PreviousScreenTitle"` will fail. Use `pressKey: Back` to trigger Android system back navigation.
- **`SafeAreaView` must come from `react-native-safe-area-context`:** React Native's built-in `SafeAreaView` does not correctly apply the top inset on Android. Using it places the header under the status bar, where it is invisible to Maestro's accessibility tree. Always import from `react-native-safe-area-context`.
- **Tab navigation: use `router.navigate`, not `router.push`:** `router.push('/(app)/collections')` creates a stack entry inside the tab navigator. This corrupts tab-switching state — subsequent `tapOn` the Collections tab may silently no-op. Use `router.navigate` to switch tabs without adding history.
- **Metro `.js`→`.ts` resolution:** `@my-collections/shared` uses TypeScript Node16 module resolution (explicit `.js` extensions in source imports). Expo SDK 52+ routes Metro to the TypeScript source of workspace packages. Without `metro.config.js`'s custom resolver, Metro fails to resolve `./types/common.js` when processing the shared package source. The config is already in place — do not remove it.
- **`react-native-svg` requires a native rebuild:** Adding `react-native-svg` (or any package with native modules) requires a full `expo run:android` rebuild — Metro hot reload alone won't pick it up. Install via `npx expo install react-native-svg` (run from `packages/mobile/`) to get the Expo SDK-compatible version. Gradle also requires `JAVA_HOME` and `android/local.properties` with `sdk.dir` pointing to the Android SDK.
- **Maestro: always `waitForAnimationToEnd` after navigation:** After any `tapOn` that triggers a stack push or tab switch, add `waitForAnimationToEnd` before asserting on screen content. Without it, Maestro evaluates the accessibility hierarchy mid-transition and misses newly visible elements, causing spurious timeouts even when the target element is present.
- **`FlatList` `ListHeaderComponent` unreliable in Maestro:** Text rendered inside `ListHeaderComponent` is not consistently visible in Android's accessibility tree during Maestro assertions. Place count or summary views in a sibling `View` above the `FlatList` instead.
- **Nullable DB columns in `BrowseItem`:** TypeORM returns `null` (not `undefined`) for nullable columns. Type optional fields as `T | null` and guard with `!= null` rather than `!== undefined`.
