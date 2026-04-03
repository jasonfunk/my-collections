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
├── docs/
├── .git/
├── .gitignore
├── .mcp.json
├── .nvmrc
├── CLAUDE.md
├── docker-compose.yml
├── package.json
├── tsconfig.base.json
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

### `turbo.json`
Turborepo pipeline configuration. Defines how tasks (`build`, `dev`, `lint`, `test`) relate to each other across packages. The critical rule: `build` depends on `^build`, meaning Turborepo always builds a package's dependencies before it — so `shared` is compiled before `api`, `web`, and `mobile`.

---

## `postman/`

```
postman/
├── environment.json       ← dev environment variables (baseUrl, accessToken, refreshToken, clientId)
├── auth.collection.json   ← all auth endpoints (register, authorize, login, token, revoke)
└── users.collection.json  ← user profile endpoints (GET /users/me)
```

Postman Collection v2.1 schema. Import into Postman alongside the environment file to test the API interactively without needing Swagger.

**Convention:** One collection file per API module. Each collection uses `{{baseUrl}}` and `{{accessToken}}` environment variable references. New API modules should add a corresponding collection file here.

**PKCE testing note:** When testing the full authorization code flow, generate a random `code_verifier`, compute `code_challenge = base64url(SHA256(code_verifier))`, use the challenge in `GET /auth/authorize` and `POST /auth/login`, then provide the verifier in `POST /auth/token`. The collection includes example values.

---

## `docs/`

```
docs/
├── overview.md
├── setup-log.md        ← this session
└── project-structure.md  ← this file
```

### `docs/overview.md`
Original project goals document. Describes the dual purpose (learning + functional app), the six learning goals, and the intended tech stack. The source of record for *why this project exists*.

### `docs/setup-log.md`
Chronological journal of every significant action taken — commands run, configurations made, decisions made, and their reasoning. Append a new entry after every work session. Primary learning reference.

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
Types specific to original Kenner Star Wars figures (1977–1985):
- `StarWarsFigure` — extends `CollectionItem`; adds `line` (which product line), `figureSize`, `isCarded`, `cardbackStyle`, variant tracking, accessories list vs owned accessories list
- `StarWarsLine` — enum of product lines (Star Wars, ESB, ROTJ, POTF)
- `CardbackStyle` — enum of cardback variations (12-back through POTF) important for variant collectors
- `FigureSize` — 3¾ inch, 12-inch, or mini

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
│   │   │   │   └── password.service.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.ts
│   │   │   └── decorators/
│   │   │       └── current-user.decorator.ts
│   │   └── users/              ← user profile module
│   │       ├── users.module.ts
│   │       ├── users.controller.ts
│   │       └── users.service.ts
│   ├── database/
│   │   └── seeds/
│   │       └── oauth-clients.seed.ts
│   ├── common/                 ← shared guards, interceptors, pipes
│   └── config/                 ← configuration logic
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
Application entry point. Bootstraps the NestJS app, registers global middleware (validation pipe, CORS), and sets up Swagger documentation. The `bootstrap()` function is equivalent to `public static void main()` in Java or `Program.cs` in C#.

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

### `src/modules/auth/`
OAuth2 Authorization Code Flow with PKCE. Owns identity: registration, login, token issuance, token rotation, logout.

**Entities** map to DB tables: `users`, `oauth_clients`, `authorization_codes`, `refresh_tokens`.

**Services:**
- `password.service.ts` — argon2 hash and verify
- `token.service.ts` — JWT sign/verify + refresh token lifecycle (issue, rotate, revoke)
- `auth.service.ts` — orchestrates the full OAuth2 flow

**Guards:** `jwt-auth.guard.ts` — validates Bearer token on protected routes; attaches decoded payload to `request.user`

**Decorators:** `current-user.decorator.ts` — extracts the payload JwtAuthGuard attached to the request. Usage: `@CurrentUser() user: AccessTokenPayload`

**Controller:** `auth.controller.ts` — 5 endpoints: register, authorize, login, token, revoke

### `src/modules/users/`
User profile data. Imports AuthModule to get the User repository (via TypeOrmModule re-export) and TokenService (for JwtAuthGuard). Keeps profile concerns separate from auth concerns.

**Controller:** `users.controller.ts` — `GET /users/me` (protected; proof the OAuth2 system works end-to-end)

### `src/database/seeds/`
Standalone ts-node scripts that run outside NestJS DI. Each creates seed data in the database.

`oauth-clients.seed.ts` — inserts the `web-app` and `mobile-app` OAuth client records. Run once after the AuthSchema migration:
```bash
npx ts-node src/database/seeds/oauth-clients.seed.ts
```

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
│   ├── components/     ← reusable UI components
│   ├── pages/          ← page-level route components
│   ├── hooks/          ← custom React hooks
│   ├── services/       ← API call functions
│   ├── store/          ← global state
│   └── assets/         ← images, fonts, etc.
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Purpose:** The React single-page application. Compiles to static files (`dist/`) that are uploaded to Dreamhost shared hosting.

**Runs on:** `http://localhost:5173` (dev server).

### `index.html`
The one and only HTML file for the entire app. The browser loads this file; React then takes over and renders everything else dynamically. The `<div id="root">` is where React mounts.

### `src/main.tsx`
JavaScript entry point (`.tsx` = TypeScript + JSX). Mounts the React app into the DOM, wrapped in:
- `StrictMode` — enables extra React warnings in development to catch potential issues early
- `BrowserRouter` — enables client-side routing (URL changes without full page reloads)

### `src/App.tsx`
Root React component. Defines the top-level route structure using React Router v6. New pages are added as `<Route>` elements here.

### `src/components/`
Reusable UI components that appear on multiple pages — buttons, cards, modals, form fields, etc. Each component in its own file.

### `src/pages/`
Page-level components — one per route/screen. These are the "views" that `App.tsx` routes to. They compose smaller components from `src/components/`.

### `src/hooks/`
Custom React hooks — reusable stateful logic extracted from components. Example: `useCollectionItems()` that fetches and caches collection data.

### `src/services/`
Functions that call the API. Keeps HTTP request logic out of components and hooks. Example: `collectionsService.ts` with `getItems()`, `createItem()`, etc.

### `src/store/`
Global application state. Will hold auth state, collection data cache, UI state, etc. Technology TBD (React Context, Zustand, or Redux).

### `vite.config.ts`
Vite build and dev server configuration. Key setting: the `/api` proxy forwards requests to `http://localhost:3000` during development so the web app can call the API without CORS issues.

### `tsconfig.json`
Extends `../../tsconfig.base.json`. Adds `"lib": ["DOM", "DOM.Iterable"]` (browser APIs) and `"jsx": "react-jsx"` (React JSX transform). Sets `"noEmit": true` because Vite handles compilation — TypeScript is only used for type checking.

---

## `packages/mobile/` — @my-collections/mobile

```
packages/mobile/
├── src/
│   ├── screens/
│   │   └── HomeScreen.tsx
│   ├── components/     ← reusable UI components
│   ├── navigation/     ← navigation config
│   ├── hooks/          ← custom hooks
│   └── services/       ← API call functions
├── app.json
├── package.json
└── tsconfig.json
```

**Purpose:** The Expo/React Native mobile app. Shares types with the API and web app via `@my-collections/shared`. Targets Android first, iOS second from a single codebase.

**Runs via:** `expo start` (opens Expo Go or connects to an emulator).

### `app.json`
Expo project configuration. Defines:
- App name, version, icon, and splash screen
- Bundle identifiers (`com.mycollections.app`) used to identify the app in app stores
- **Plugins** — declares which native device capabilities the app uses:
  - `expo-camera` — camera access
  - `expo-barcode-scanner` — barcode/QR scanning
  - `expo-notifications` — push notifications

### `src/screens/`
One component per app screen. Screens are what navigation moves between. `HomeScreen.tsx` is the placeholder dashboard.

### `src/components/`
Reusable React Native UI components shared across multiple screens.

### `src/navigation/`
Navigation configuration — defines the app's tab structure, stack navigators, and deep link handling. Will use Expo Router (file-based routing) or React Navigation.

### `src/hooks/`
Custom hooks for device features and shared logic — e.g., `useCamera()`, `useBarcodeScanner()`.

### `src/services/`
API call functions — same pattern as the web app's `src/services/`. Shared logic may eventually move to `packages/shared/`.

### `tsconfig.json`
Extends Expo's base TypeScript config (`expo/tsconfig.base`). Adds a `paths` alias so `@my-collections/shared` resolves directly to the shared package source during development.
