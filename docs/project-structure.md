# Project Structure

Reference guide to every directory and file in the repository. For a chronological record of *when* and *why* things were created, see [setup-log.md](./setup-log.md).

---

## Repository Root

```
my-collections/
├── .github/
│   └── workflows/
├── packages/
├── postman/               ← Postman collections and environment (one file per API module)
├── scripts/               ← one-off utility scripts (scraper, data patches)
├── docs/
├── .git/
├── .gitignore
├── .mcp.json
├── .nvmrc
├── CLAUDE.md
├── docker-compose.yml
├── package.json
├── tsconfig.base.json
├── tsconfig.scripts.json  ← CJS module override for ts-node scripts
└── turbo.json
```

### `.github/workflows/`
GitHub Actions CI/CD workflow definitions. Three files:

| File | Trigger | Purpose |
|---|---|---|
| `ci.yml` | PR to `main` or `develop` | Runs lint and tests in parallel. Both must pass before a PR can merge. |
| `build.yml` | Push to `main` (i.e., after a merge) | Verifies the full monorepo builds successfully after every merge. |
| `audit.yml` | PR + weekly Monday schedule | Runs `npm audit --audit-level=critical --omit=dev`. Fails only on critical-severity vulnerabilities in non-dev dependencies. |

### `docker-compose.yml`
Defines the local development database service. Run `docker compose up -d` from the repo root to start a PostgreSQL 16 container on port 5432. Data is persisted in the `postgres_data` named volume — survives `docker compose down` but is wiped by `docker compose down -v`.

Credentials (user: `my_collections`, password: `my_collections_dev`, database: `my_collections`) are dev-only and match the `DATABASE_URL` in `packages/api/.env`.

### `.git/`
Created by `git init`. Contains the entire version history of the project. Never edit this manually.

### `.gitignore`
Tells git which files and folders to never track. Key exclusions: `node_modules/`, `dist/`, `build/`, `.env` files, IDE folders, and Expo build artifacts.

### `.nvmrc`
Specifies the Node.js version for this project (`24`). Used by [nvm](https://github.com/nvm-sh/nvm) — running `nvm use` in the project directory switches Node to the declared version automatically.

### `CLAUDE.md`
Instructions for Claude Code when working in this repository. Contains the tech stack, collaboration approach, development commands, and references to key documentation. **This file guides AI-assisted development sessions.**

### `package.json`
The monorepo root package file. Declares npm workspaces (`packages/*`) so a single `npm install` from this directory installs dependencies for all four packages. Also delegates `dev`, `build`, `lint`, and `test` scripts to Turborepo.

### `tsconfig.base.json`
Base TypeScript configuration extended by every package. Ensures consistent compiler settings (strict mode, ES2020 target, source maps, etc.) across the whole project without repeating them in each package.

### `tsconfig.scripts.json`
TypeScript configuration override for scripts in the `scripts/` directory. `tsconfig.base.json` uses `"module": "ESNext"` / `"moduleResolution": "bundler"` for compatibility with Vite and NestJS's build pipelines, but `ts-node` requires CommonJS. This file extends `tsconfig.base.json` and overrides just those two settings. Usage: `ts-node --project tsconfig.scripts.json scripts/my-script.ts`.

### `turbo.json`
Turborepo pipeline configuration. Defines how tasks (`build`, `dev`, `lint`, `test`) relate to each other across packages. The critical rule: `build` depends on `^build`, meaning Turborepo always builds a package's dependencies before it — so `shared` is compiled before `api`, `web`, and `mobile`.

---

## `postman/`

```
postman/
├── environment.json                    ← dev environment variables (baseUrl, accessToken, refreshToken, clientId)
├── auth.collection.json                ← all auth endpoints (register, authorize, login, token, revoke)
├── users.collection.json               ← user profile endpoints (GET /users/me)
├── collections.collection.json         ← CRUD endpoints for all three collection types + stats
├── collections-photos.collection.json  ← photo upload (POST /collections/photos/upload) + static file serve
└── health.collection.json              ← health check endpoints (GET /health, GET /health/ready)
```

Postman Collection v2.1 schema. Import into Postman alongside the environment file to test the API interactively without needing Swagger.

**Convention:** One collection file per API module. Each collection uses `{{baseUrl}}` and `{{accessToken}}` environment variable references. New API modules should add a corresponding collection file here.

**PKCE testing note:** When testing the full authorization code flow, generate a random `code_verifier`, compute `code_challenge = base64url(SHA256(code_verifier))`, use the challenge in `GET /auth/authorize` and `POST /auth/login`, then provide the verifier in `POST /auth/token`. The collection includes example values.

---

## `scripts/`

```
scripts/
├── scrape-star-wars-catalog.ts     ← Playwright + cheerio scraper (190 items, ~3.5 min)
├── scrape-transformers-catalog.ts  ← same for G1 Transformers (443 items, ~8 min)
├── scrape-he-man-catalog.ts        ← same for MOTU (127 items, ~2.5 min)
├── patch-star-wars-12inch.ts       ← manual patch: 9 twelve-inch figures not on site
├── patch-star-wars-line.ts         ← derives line/coinIncluded/releaseYear from year field
├── patch-he-man-charactertype.ts   ← sets characterType from MOTU collector knowledge
└── patch-he-man-enrichment.ts      ← sets miniComic, hasArmorOrFeature, featureDescription
```

**Purpose:** One-off utility scripts for data collection and curation. These are not part of the Turborepo build pipeline and are never imported by other packages. Run individually via `ts-node --project tsconfig.scripts.json`, or via the npm scripts defined in the root `package.json`.

**Pre-requisite:** `npx playwright install chromium` — downloads the Chromium browser binary (~92 MB, one-time). All scrapers use `headless: false` because transformerland.com's Cloudflare protection blocks headless Chromium. A browser window opens during each scrape run.

**Scrapers** fetch the transformerland.com wiki index, visit each detail page, and write JSON to `packages/api/src/database/seeds/data/`. Rate-limited to ~1 req/sec. Run via:
```bash
npm run scrape:star-wars
npm run scrape:transformers
npm run scrape:he-man
```

**Re-scrape workflow:** All three scrapers share the same `extractAccessories()` logic. After modifying any extractor function, re-run **all** scrapers before committing — the fix lives in code; JSON is only updated by running the scraper.

**Patch scripts** are idempotent and safe to re-run. Always re-apply patches in order after re-scraping:
```bash
# Star Wars — must run both after each scrape
npx ts-node --project tsconfig.scripts.json scripts/patch-star-wars-12inch.ts
npx ts-node --project tsconfig.scripts.json scripts/patch-star-wars-line.ts

# He-Man — must run both after each scrape
npx ts-node --project tsconfig.scripts.json scripts/patch-he-man-charactertype.ts
npm run patch:he-man-enrichment
```

**`patch-star-wars-12inch.ts`** — appends 9 manually-curated twelve-inch figures missing from transformerland.com.

**`patch-star-wars-line.ts`** — derives `line` (STAR_WARS / ESB / ROTJ / POTF), `coinIncluded`, and `releaseYear` from the `year` field in the JSON.

**`patch-he-man-charactertype.ts`** — sets `characterType` (HEROIC / EVIL / etc.) from MOTU collector knowledge; the URL-based scraper extraction misses some items.

**`patch-he-man-enrichment.ts`** — sets `miniComic`, `hasArmorOrFeature`, and `featureDescription`; this data is completely absent from transformerland.com and is sourced from MOTU collector databases.

---

## `docs/`

```
docs/
├── overview.md
├── setup-log.md              ← chronological work journal
├── plan-catalog-refactor.md  ← design decisions for COL-61 catalog/user-items split
├── confluence-style-guide.md ← formatting conventions for Confluence pages
├── project-structure.md      ← this file
└── confluence/               ← local markdown mirror of all Confluence pages
    ├── README.md             ← page registry + update workflow
    ├── technical-documentation.md
    ├── documentation-style-guide.md
    ├── project-architecture.md
    ├── api-reference.md
    ├── authentication-api.md
    ├── users-api.md
    ├── collections-api.md
    ├── star-wars-figures.md
    ├── g1-transformers.md
    ├── masters-of-the-universe.md
    ├── web-application-architecture.md
    ├── infrastructure-overview.md
    └── server-setup-runbook.md
```

### `docs/overview.md`
Original project goals document. Describes the dual purpose (learning + functional app), the six learning goals, and the intended tech stack. The source of record for *why this project exists*.

### `docs/setup-log.md`
Chronological journal of every significant action taken — commands run, configurations made, decisions made, and their reasoning. Append a new entry after every work session. Primary learning reference.

### `docs/confluence-style-guide.md`
Formatting conventions for Confluence pages (headings, code blocks, panels, tables, naming). Mirrors the Confluence Documentation Style Guide page. Read this instead of downloading from Confluence.

### `docs/confluence/`
Local markdown mirror of all Confluence documentation pages. Each file has YAML frontmatter with the Confluence page ID and URL. **Workflow:** edit the markdown file here, then push the content to Confluence via `mcp__atlassian__updateConfluencePage`. See `docs/confluence/README.md` for the full page registry and staleness guide.

### `docs/project-structure.md`
This file. Static reference to what each directory and file does. Update it when new files or directories are added.

---

## `packages/shared/` — @my-collections/shared

```
packages/shared/
├── src/
│   ├── index.ts
│   └── types/
│       ├── common.ts
│       ├── star-wars.ts
│       ├── transformers.ts
│       ├── he-man.ts
│       └── auth.ts
├── package.json
└── tsconfig.json
```

**Purpose:** The single source of truth for TypeScript types used across the entire project. The API, web app, and mobile app all import from this package. Defining types here once prevents them from drifting out of sync across packages.

**Build output:** Compiles to `dist/` (TypeScript → JavaScript + `.d.ts` declaration files). Other packages import the compiled output.

### `src/index.ts`
The public API of the package. Re-exports everything from the `types/` files. Consumers write `import { CollectionItem } from '@my-collections/shared'` — they never import from sub-paths.

### `src/types/common.ts`
Base types shared across all collections:
- `CollectionItem` — base interface every collection item type extends. Contains fields all items share: `id`, `name`, `condition`, `isOwned`, `acquisitionSource`, `estimatedValue`, `photoUrls`, etc.
- `ConditionGrade` — enum of collector condition grades (C10 = Mint down to C4 = Poor)
- `PackagingCondition` — condition of original box/card/packaging (separate from item condition)
- `AcquisitionSource` — how the item was obtained (eBay, flea market, original childhood toy, etc.)
- `CollectionType` — enum identifying which collection an item belongs to (STAR_WARS, TRANSFORMERS, HE_MAN)

### `src/types/star-wars.ts`
Types specific to original Kenner Star Wars figures (1977–1985). Split into catalog (what Kenner made) and user-items (personal records) after COL-62:
- `StarWarsCatalogItem` — shape of the `star_wars_catalog` table: `name`, `category`, `line`, `accessories[]`, `catalogImageUrl`, `externalId`, variant fields, figure/vehicle-specific nullable fields
- `UserStarWarsItem` — personal record: `catalogId`, `isOwned`, `wishlistPriority`, `condition`, `ownedAccessories[]`, `photoUrls[]`, acquisition info
- `StarWarsCategory` — enum of product categories: `BASIC_FIGURE | VEHICLE | PLAYSET | CREATURE | MINI_RIG | ACCESSORY | TWELVE_INCH | COLLECTOR_CASE | ROLEPLAY | DIE_CAST`
- `StarWarsLine` — enum of product lines (Star Wars, ESB, ROTJ, POTF)
- `CardbackStyle` — enum of cardback variations (12-back through POTF) important for variant collectors
- `FigureSize` — 3¾ inch, 12-inch, or mini
- `StarWarsFigure` — **deprecated** legacy interface kept for backward compatibility

### `src/types/transformers.ts`
Types specific to Generation 1 Transformers (1984–1990):
- `G1Transformer` — extends `CollectionItem`; adds `faction` (Autobot/Decepticon), `line` (series year), `altMode` (what it transforms into), `isCombiner`, `combinerTeam`, `hasTechSpec`, `rubSign`, etc.
- `TransformersFaction`, `TransformersLine`, `TransformerSize` — supporting enums

### `src/types/he-man.ts`
Types specific to Masters of the Universe figures (1981–1988):
- `MastersOfTheUniverseFigure` — extends `CollectionItem`; adds `characterType` (heroic/evil), `miniComic`, variant tracking, `hasArmorOrFeature` for action features
- `MastersLine` — original line, Princess of Power, mini figures
- `MastersCharacterType` — heroic warrior, evil warrior, etc.

### `src/types/auth.ts`
Auth-related types shared between the API (producer) and web/mobile apps (consumers):
- `AccessTokenPayload` — shape of the JWT payload (`sub`, `email`, `iat`, `exp`)
- `TokenResponse` — response shape from `POST /auth/token` (`accessToken`, `refreshToken`, `expiresIn`)
- `UserProfile` — response shape from `GET /users/me` (`id`, `email`, `isApproved`, `createdAt`)

---

## `packages/api/` — @my-collections/api

```
packages/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── data-source.ts          ← TypeORM CLI data source
│   ├── migrations/             ← database migration files
│   ├── modules/
│   │   ├── auth/               ← OAuth2 auth module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── oauth-client.entity.ts
│   │   │   │   ├── authorization-code.entity.ts
│   │   │   │   └── refresh-token.entity.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── token.service.ts
│   │   │   │   ├── password.service.ts
│   │   │   │   ├── token.service.spec.ts     ← unit tests: JWT sign/verify
│   │   │   │   └── password.service.spec.ts  ← unit tests: argon2 hash/verify
│   │   │   ├── auth.controller.spec.ts        ← integration tests: full OAuth2 PKCE flow
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   └── decorators/
│   │   │       └── current-user.decorator.ts
│   │   ├── collections/        ← CRUD, photos, search, stats for all collection types
│   │   │   ├── controllers/
│   │   │   │   ├── photos.controller.ts
│   │   │   │   ├── photos.controller.spec.ts  ← integration tests: upload validation + auth
│   │   │   │   └── __mocks__/
│   │   │   │       └── file-type.ts           ← jest.fn() shim for ESM file-type library
│   │   │   └── (other controllers, services, entities)
│   │   ├── health/             ← liveness + readiness endpoints (no auth)
│   │   │   ├── health.controller.ts
│   │   │   └── health.module.ts
│   │   └── users/              ← user profile module
│   │       ├── users.module.ts
│   │       ├── users.controller.ts
│   │       └── users.service.ts
│   ├── database/
│   │   └── seeds/
│   │       └── oauth-clients.seed.ts
│   ├── common/                 ← shared guards, interceptors, pipes
│   └── config/                 ← configuration logic
├── uploads/                    ← uploaded item photos (gitignored except .gitkeep; served at /uploads/*)
├── .env                        ← local env vars (gitignored, never committed)
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.eslint.json        ← extends tsconfig.json to include spec files for ESLint
```

**Purpose:** The NestJS REST API. Handles business logic, database access (PostgreSQL via TypeORM), authentication (OAuth2), and serves data to both the web app and mobile app.

**Runs on:** `http://localhost:3000` (dev). Swagger UI available at `/api/docs`.

**Framework pattern:** NestJS organizes code into *modules*. Each feature area (collections, auth, users) gets its own module folder under `src/modules/`. Each module contains a controller (handles HTTP requests), a service (business logic), and entities (database table definitions). This is the same pattern as Spring MVC controllers/services/repositories or ASP.NET Core controllers/services.

### `src/main.ts`
Application entry point. Bootstraps the NestJS app, registers global middleware (validation pipe, CORS), and sets up Swagger documentation. The `bootstrap()` function is equivalent to `public static void main()` in Java or `Program.cs` in C#. Winston (via `nest-winston`) is configured here as the application logger — JSON format in production, colorized in development. `bufferLogs: true` ensures no log output is lost before the logger is fully initialized.

### `src/app.module.ts`
Root module — the top of the dependency injection tree. All feature modules are imported here. `ConfigModule.forRoot({ isGlobal: true })` makes environment variables accessible throughout the app without re-importing in every module. `TypeOrmModule.forRootAsync()` wires the database connection using `DATABASE_URL` from `.env`.

### `src/data-source.ts`
Standalone TypeORM `DataSource` used exclusively by the TypeORM CLI for migration commands (`migration:generate`, `migration:run`, etc.). This file exists separately from the NestJS module because the CLI runs outside of the NestJS DI container and cannot access `ConfigService`. It reads `DATABASE_URL` directly from the environment via `dotenv`.

### `src/migrations/`
Database migration files generated by TypeORM. Each file is a timestamped class implementing `up()` (apply change) and `down()` (revert change). TypeORM tracks which migrations have run in the `migrations` table in the database.

**Key commands (run from `packages/api/`):**
```bash
npm run migration:create -- src/migrations/MigrationName  # blank migration
npm run migration:generate -- src/migrations/MigrationName  # auto-generate from entity diff
npm run migration:run    # apply pending migrations
npm run migration:revert # undo last migration
npm run migration:show   # list all migrations and status
```

**Convention:** When a generated migration has empty `up()`/`down()` bodies, rename the `queryRunner` parameter to `_queryRunner` to satisfy the ESLint no-unused-vars rule.

**uuid-ossp extension:** TypeORM generates `uuid_generate_v4()` for UUID primary keys but does not emit the PostgreSQL extension that provides it. Any migration creating tables with UUID PKs must include this at the top of `up()`:
```typescript
await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
```
Without it, the migration will fail on a fresh PostgreSQL instance with `function uuid_generate_v4() does not exist`.

**`migrationsRun: true` auto-applies on startup:** The NestJS app module is configured with `migrationsRun: true`, meaning TypeORM runs all pending migrations automatically when the app starts. This means `npm run migration:run` via the CLI may report "No migrations are pending" if the app was started first — the migrations already ran. Use `migration:show` to confirm the actual applied status.

### `src/modules/auth/`
OAuth2 Authorization Code Flow with PKCE. Owns identity: registration, login, token issuance, token rotation, logout.

**Entities** map to DB tables: `users`, `oauth_clients`, `authorization_codes`, `refresh_tokens`.

**Services:**
- `password.service.ts` — argon2 hash and verify
- `token.service.ts` — JWT sign/verify + refresh token lifecycle (issue, rotate, revoke)
- `auth.service.ts` — orchestrates the full OAuth2 flow
- `token-cleanup.service.ts` — daily cron (`@Cron(EVERY_DAY_AT_MIDNIGHT)`) that hard-deletes expired/revoked refresh tokens and used/expired authorization codes; logs purge counts via NestJS Logger

**Guards:** `jwt-auth.guard.ts` — validates Bearer token on protected routes; attaches decoded payload to `request.user`

**Decorators:** `current-user.decorator.ts` — extracts the payload JwtAuthGuard attached to the request. Usage: `@CurrentUser() user: AccessTokenPayload`

**Controller:** `auth.controller.ts` — 5 endpoints: register, authorize, login, token, revoke

### `src/modules/health/`
Liveness and readiness probes. No auth guard — intended for load balancer / uptime monitoring. `GET /health` returns `{ status: 'ok' }`. `GET /health/ready` checks `dataSource.isInitialized` and returns `{ status: 'ready', db: 'ok' }` or 503 if the DB is not connected. Both endpoints are decorated with `@SkipThrottle()` to exempt them from rate limiting.

### `src/modules/users/`
User profile data. Imports AuthModule to get the User repository (via TypeOrmModule re-export) and TokenService (for JwtAuthGuard). Keeps profile concerns separate from auth concerns.

**Controller:** `users.controller.ts` — `GET /users/me` (protected; proof the OAuth2 system works end-to-end)

### `src/database/seeds/`
Standalone ts-node scripts that run outside NestJS DI. Each creates seed data in the database.

```
seeds/
├── oauth-clients.seed.ts
├── run-star-wars-seed.ts
├── run-transformers-seed.ts
├── run-he-man-seed.ts
└── data/
    ├── star-wars-catalog.json         ← 199 items (190 scraped + 9 twelve-inch patch)
    ├── g1-transformers-catalog.json   ← 443 items
    └── he-man-catalog.json            ← 127 items (+ enrichment patches applied)
```

`oauth-clients.seed.ts` — inserts the `web-app` and `mobile-app` OAuth client records. Run once after the AuthSchema migration:
```bash
npx ts-node src/database/seeds/oauth-clients.seed.ts
```

Catalog seed runners support two modes. Run from repo root:
```bash
npm run seed:star-wars                  # insert-only (safe default)
npm run seed:star-wars -- --update      # upsert: update existing rows too
npm run seed:transformers -- --update
npm run seed:he-man -- --update
```

`data/*.json` — canonical datasets for each collection. These are the ground-truth source of record, committed to git. The scraper writes the initial data; patch scripts layer on data the site doesn't carry. Re-seed with `--update` after any JSON change to propagate to the dev DB.

### `src/common/`
Shared cross-cutting code: guards (authorization checks), interceptors (request/response transforms), pipes (input validation). Not yet populated.

### `src/config/`
Configuration loading and validation logic. Not yet populated.

### `.env.example`
Template showing which environment variables the API needs. Copy this to `.env` (which is git-ignored) and fill in real values:
```
PORT=3000
DATABASE_URL=postgresql://my_collections:my_collections_dev@localhost:5432/my_collections
JWT_ACCESS_SECRET=change-me-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-in-production-too
JWT_REFRESH_EXPIRES_IN=30d
REGISTRATION_ENABLED=true
```

### `tsconfig.eslint.json`
Extends `tsconfig.json` but removes the `**/*.spec.ts` exclusion. ESLint's `parserOptions.project` points at this file so spec files get type-checked without affecting the production build. Standard pattern for TypeScript + ESLint + Jest repos.

### `nest-cli.json`
Configuration for the NestJS CLI tool (`@nestjs/cli`). Tells the CLI where source files live and how to compile. The CLI provides code generation commands (e.g., `nest generate module collections`).

### `tsconfig.json`
Extends `../../tsconfig.base.json`. Adds NestJS-specific settings: `"emitDecoratorMetadata": true` and `"experimentalDecorators": true` — required for NestJS decorators (`@Controller()`, `@Injectable()`, etc.) to work at runtime. Also overrides `module` to `CommonJS` since Node.js uses CommonJS modules.

---

## `packages/web/` — @my-collections/web

```
packages/web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   └── client.ts               ← typed fetch wrapper (auth injection, 401 refresh, multipart upload)
│   ├── auth/
│   │   ├── AuthContext.tsx          ← OAuth2 PKCE login/logout/session restore
│   │   ├── pkce.ts                  ← code verifier + challenge generation
│   │   └── tokenStorage.ts          ← access token (in-memory), refresh token (localStorage)
│   ├── components/
│   │   ├── collections/
│   │   │   ├── forms/
│   │   │   │   ├── BaseFormFields.tsx       ← common fields for all collection types
│   │   │   │   ├── StarWarsFormFields.tsx   ← Star Wars-specific form fields
│   │   │   │   ├── TransformersFormFields.tsx
│   │   │   │   └── MastersFormFields.tsx
│   │   │   ├── AccessoriesList.tsx  ← accessory display with owned/missing state
│   │   │   ├── ConditionBadge.tsx
│   │   │   ├── FilterBar.tsx        ← grid/list toggle + owned/condition/line filters
│   │   │   ├── ItemCard.tsx         ← grid card component
│   │   │   └── ItemTable.tsx        ← table view component
│   │   └── ui/                      ← shadcn/ui primitives + custom: collection-icons, collection-progress-icon
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── collectionConfig.ts      ← collection metadata, apiPath, enum label maps
│   │   └── utils.ts                 ← cn() Tailwind utility
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── CallbackPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── collections/
│   │       ├── CollectionListPage.tsx    ← paginated list/grid with filters
│   │       ├── CollectionDetailPage.tsx  ← full item detail view
│   │       └── CollectionFormPage.tsx    ← add/edit form (create = /new, edit = /:id/edit)
│   └── router/
│       └── ProtectedRoute.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Purpose:** The React single-page application. Compiles to static files (`dist/`) that are uploaded to Dreamhost shared hosting.

**Runs on:** `http://localhost:5173` (dev server).

### `src/api/client.ts`
Typed `fetch` wrapper. Prepends `/api` (proxied to localhost:3000 in dev). Injects `Authorization: Bearer <token>` on every request. On 401, attempts one silent token refresh then retries; if refresh fails, calls logout. Also exports `uploadFile()` for multipart/form-data POSTs (photo upload).

### `src/auth/`
OAuth2 Authorization Code Flow with PKCE. `AuthContext` provides `login()`, `logout()`, `refreshTokens()`, and session restoration on page load. Access token stored in-memory (cleared on hard refresh); refresh token stored in `localStorage` and used to restore session on mount.

### `src/App.tsx`
Root React component. Defines the top-level route structure using React Router v6. Route order matters: `/new` and `/:id/edit` must appear before `/:id` to prevent the literal string "new" from matching as an item UUID.

### `src/components/collections/forms/`
Form field components split by collection type. `BaseFormFields` handles all shared fields (name, condition, acquisition, notes, photo upload widget). Each collection-specific file handles its own fields and the `AccessoryEditor` for managing the accessories/ownedAccessories arrays.

### `src/pages/collections/CollectionFormPage.tsx`
Unified create/edit page. Determines mode from whether `id` param is present. In edit mode, fetches the existing item and populates form state. Uses `useMutation` (TanStack Query) to POST (create) or PATCH (update). On success, invalidates the collection list query and navigates away.

### `src/lib/collectionConfig.ts`
Central config map from collection URL key (`star-wars`, `transformers`, `he-man`) to API path, display label, emoji, and available filter options. All pages use `getConfig(key)` so adding a new collection type only requires one change here.

### `vite.config.ts`
Vite build and dev server configuration. Key setting: the `/api` proxy rewrites and forwards requests to `http://localhost:3000` during development so the web app can call the API without CORS issues.

### `tsconfig.json`
Extends `../../tsconfig.base.json`. Adds `"lib": ["DOM", "DOM.Iterable"]` (browser APIs) and `"jsx": "react-jsx"` (React JSX transform). Sets `"noEmit": true` because Vite handles compilation — TypeScript is only used for type checking.

---

## `packages/mobile/` — @my-collections/mobile

```
packages/mobile/
├── app/
│   ├── _layout.tsx             # Root layout — wraps AuthProvider, no nav chrome
│   ├── (auth)/
│   │   ├── _layout.tsx         # Stack navigator for auth screens
│   │   └── login.tsx           # Email/password login form
│   └── (app)/
│       ├── _layout.tsx         # Protected layout — auth guard + bottom Tabs chrome
│       ├── index.tsx           # Dashboard tab (home)
│       ├── collections/
│       │   ├── _layout.tsx              # Stack navigator for drill-down
│       │   ├── index.tsx                # Collection picker (three tappable cards → browse)
│       │   ├── [collection].tsx         # Browse screen — FlatList of items, + button header
│       │   └── [collection]/
│       │       ├── [id].tsx             # Item detail screen — condition, accessories, acquisition, notes, photos; useFocusEffect refresh
│       │       ├── add.tsx              # Add item — two-step: catalog search → personal record form
│       │       └── edit/
│       │           └── [id].tsx         # Edit item — pre-populated form + delete
│       ├── wishlist.tsx        # Wishlist tab
│       └── search.tsx          # Search tab
├── src/
│   ├── api/
│   │   └── client.ts           # Typed fetch wrapper — 401-retry, token injection, multipartPost, exports API_BASE
│   ├── auth/
│   │   ├── AuthContext.tsx     # AuthProvider — login/logout/refresh, session restore
│   │   ├── pkce.ts             # PKCE code verifier + challenge (expo-crypto)
│   │   └── tokenStorage.ts     # expo-secure-store wrappers for refresh token
│   ├── components/
│   │   ├── CollectionIcon.tsx  # SVG collection icons (react-native-svg) + FaviconIcon
│   │   ├── FilterSheet.tsx     # Slide-up filter modal (status: all/owned/wishlist)
│   │   ├── ItemForm.tsx        # Shared add/edit form — all field sections + buildPayload(form, collectionType)
│   │   └── SelectPicker.tsx    # Modal-based enum picker (condition, source, priority, etc.)
│   ├── config/
│   │   └── collections.ts      # COLLECTION_CONFIG + SLUG_TO_COLLECTION reverse map
│   ├── hooks/
│   │   └── useAuth.ts          # useAuth() hook over AuthContext
│   └── services/
│       └── collectionsService.ts  # fetchItems, fetchItemDetail, searchCatalog, createItem, updateItem, deleteItem
├── .maestro/                   # Maestro UI smoke tests
│   ├── smoke-test.yaml         # Orchestrates 6-flow: login → stats → tabs → item-detail → add-edit-item → logout
│   ├── auth/
│   │   ├── login.yaml
│   │   └── logout.yaml
│   ├── collections/
│   │   ├── add-edit-item.yaml  # Add Luke Skywalker → edit notes → assert detail refresh → delete → verify count
│   │   └── item-detail.yaml    # Browse → tap item → assert detail sections → back
│   ├── dashboard/
│   │   └── stats.yaml          # Asserts collection cards, totals, card-tap navigation
│   └── navigation/
│       └── tabs.yaml
├── app.json
├── metro.config.js             # Metro bundler config — .js→.ts resolver for Node16 workspace pkgs
├── package.json
└── tsconfig.json
```

**Purpose:** The Expo/React Native mobile app. Shares types with the API and web app via `@my-collections/shared`. Targets Android first, iOS second from a single codebase.

**Runs via:** `npm run dev --workspace=packages/mobile` (starts Expo dev server).

### `app/` — Expo Router file-based routes

Expo Router maps files to routes, exactly like Next.js's `app/` directory but for React Native. Key conventions:

- **`_layout.tsx`** in a folder wraps all routes in that folder (equivalent to a React Router `<Outlet>` parent).
- **`(group)` folders** — the parentheses are stripped from the URL. They group related screens under a shared layout without affecting the route path.
- **`(auth)/`** — contains the login screen. Its layout is a simple Stack (push/pop navigator). Unauthenticated users land here.
- **`(app)/`** — the protected section. Its layout checks `isAuthenticated`; unauthenticated users are redirected to `/(auth)/login`. Authenticated users see the bottom tab bar with Dashboard, Collections, Wishlist, and Search.

### `app.json`
Expo project configuration. Defines app name, version, icon, splash screen, bundle identifiers (`com.mycollections.app`), and native capability plugins:
- `expo-camera` — camera access
- `expo-barcode-scanner` — barcode/QR scanning
- `expo-notifications` — push notifications

### `src/auth/AuthContext.tsx`
`AuthProvider` wraps the entire app (mounted in `app/_layout.tsx`). Provides `login()`, `logout()`, `refreshTokens()`, `isAuthenticated`, and `isLoading`. On mount, attempts to restore the previous session by reading the refresh token from SecureStore and calling `POST /auth/token` with a `refresh_token` grant. Uses the full OAuth2 PKCE flow for login — same steps as the web app, but with `mycollections://auth/callback` as the redirect URI.

### `src/auth/tokenStorage.ts`
Two-tier token storage: access token held in memory (fast, never written to disk, lost on app close), refresh token stored in `expo-secure-store` (encrypted device keychain, survives restarts). On session restore, the refresh token is read from SecureStore to obtain a new access token without requiring re-login.

### `src/auth/pkce.ts`
PKCE helpers adapted for React Native. Uses `expo-crypto` (`Crypto.getRandomValues` + `Crypto.digestStringAsync`) instead of `window.crypto.subtle`.

### `src/api/client.ts`
Typed `fetch` wrapper. Reads `EXPO_PUBLIC_API_BASE_URL` from the environment. Injects `Authorization: Bearer <token>` on every request. On 401, attempts one silent token refresh (deduplicating concurrent refresh calls via a shared promise) then retries; if refresh fails, calls `logout()`.

### `src/hooks/useAuth.ts`
`useAuth()` — consumes `AuthContext`. Throws if called outside `AuthProvider`.

### `src/config/collections.ts`
Single source of truth for per-collection display config. Exports `COLLECTION_CONFIG` (keyed by `CollectionType` — label, accent color, subtitle, and URL slug) and `SLUG_TO_COLLECTION` (reverse map from slug string to `CollectionType`). Used by the dashboard, collection picker, and browse screen so display metadata never drifts out of sync.

### `src/services/collectionsService.ts`
API service for collection items. Exports two fetch functions and their return types:
- `BrowseItem` / `fetchItems(collectionType, page, limit)` — lightweight list shape (`id`, `catalog.name`, `isOwned`, `condition?`, `estimatedValue?`); used by the browse screen.
- `DetailItem` / `fetchItemDetail(collectionType, id)` — full item shape including all condition fields, collection-specific fields (`isCarded`, `isBoxed`, `hasInstructions`, `rubSign`, `hasBackCard`), owned and catalog accessories, acquisition info, notes, and photo URLs; used by the detail screen. `DetailItem` is a superset covering all three collection types — collection-specific fields are optional.

### `src/components/FilterSheet.tsx`
Slide-up filter modal. Uses `Modal` + `Animated.Value` (no new dependencies). Exports `BrowseFilters` (`{ status: 'all' | 'owned' | 'wishlist' }`) and the `FilterSheet` component. Slides in from the bottom with a dim backdrop, Apply and Reset buttons, closes on backdrop tap or Apply.

### `app/(app)/collections/index.tsx`
Collection picker screen. Shown when tapping the Collections tab. Three tappable cards (same style as dashboard) each navigating to `/(app)/collections/<slug>` — `star-wars`, `transformers`, or `he-man`.

### `app/(app)/collections/[collection].tsx`
Browse screen for a single collection. Reads the `collection` slug via `useLocalSearchParams`, maps it to a `CollectionType` via `SLUG_TO_COLLECTION`, fetches items via `collectionsService.fetchItems`. Renders a `FlatList` with pull-to-refresh and a `FilterSheet` for client-side owned/wishlist filtering. Filter button in the Stack header shows an indigo dot when a filter is active. Tapping a row navigates to `/(app)/collections/<slug>/<id>`.

### `app/(app)/collections/[collection]/[id].tsx`
Full read-only item detail screen. Fetches the item via `collectionsService.fetchItemDetail` and renders a `ScrollView` with labelled sections:
- **Status header** — catalog name, Owned/Wishlist badge, wishlist priority (if applicable).
- **Condition** — figure grade (`ConditionGrade` mapped to human label), packaging condition, completeness.
- **Details** — collection-specific fields branched on `SLUG_TO_COLLECTION[slug]`: Star Wars (carded, boxed); Transformers (boxed, instructions, tech spec, rub sign); He-Man (carded, back card). All: owned accessories list with catalog accessory checklist (green = owned, gray = missing).
- **Acquisition** — source, date, price paid, estimated value (section hidden if all null).
- **Notes** — free-text notes (section hidden if null).
- **Photos** — horizontal `ScrollView` of `Image` thumbnails (section hidden if no URLs).

`Stack.Screen` title is set dynamically to `catalog.name` once loaded.

### `.maestro/`
Maestro UI test suite for Android. `smoke-test.yaml` orchestrates five flows end-to-end. Run with:
```bash
JAVA_HOME=/Users/jfunk/.gradle/jdks/eclipse_adoptium-17-aarch64-os_x.2/jdk-17.0.18+8/Contents/Home \
~/.maestro/bin/maestro test packages/mobile/.maestro/smoke-test.yaml
```
Neither `maestro` nor `JAVA_HOME` are on Claude Code's default PATH — always use the full paths above.

| Flow | Purpose |
|---|---|
| `auth/login.yaml` | Clear state → launch → login → assert dashboard |
| `auth/logout.yaml` | Tap Sign Out → assert login screen |
| `dashboard/stats.yaml` | Assert collection cards + Totals; tap Star Wars card → assert browse |
| `navigation/tabs.yaml` | Cycle all four tabs; assert placeholder content on Wishlist/Search |
| `collections/item-detail.yaml` | Dashboard → Star Wars browse → tap item → assert Condition + Details sections → back |

### `metro.config.js`
Metro bundler configuration. Uses `expo/metro-config` as the base. Adds a custom `resolveRequest` that strips `.js` extensions from relative imports before passing them to Metro's resolver — required because `@my-collections/shared` uses TypeScript Node16 module resolution (explicit `.js` extensions in source imports), but Expo SDK 52+ routes Metro directly to the TypeScript source of workspace packages. Without this, Metro fails to find `./types/common.js` when processing `shared/src/index.ts`.

### `tsconfig.json`
Extends `../../tsconfig.base.json`. Sets `"moduleResolution": "bundler"` and `"jsx": "react-native"` for Expo/Metro compatibility.
