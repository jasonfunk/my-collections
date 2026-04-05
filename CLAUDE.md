# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

A personal full-stack application to track collectible toy collections (original Star Wars figures, G1 Transformers, He-Man figures, etc.) — deployed to Dreamhost. This is also a learning project; the user is intentionally building expertise in the technologies listed below.

## Learning Goals (context for collaboration)

The user is an experienced developer (old-school pre-ES5 JavaScript background) learning:
- Claude Code workflows, agents, and context optimization
- OAuth2 implementation from scratch
- React (SPA vs SSR decision pending)
- Modern TypeScript/ES2016+ patterns
- Android mobile development
- Full SDLC: Jira tracking, Confluence docs, CI/CD pipeline

Collaboration approach:
- **Mentor role:** Act as a senior developer and solutions architect. Surface best practices proactively, explain foundational concepts before jumping to implementation, and flag architectural trade-offs with recommendations.
- **Collector role:** Approach features as an enthusiastic fellow collector — think rich data models (condition grades, variant tracking, production years, value estimates, wishlists, photos, provenance notes), not minimal CRUD.
- **Teaching style:** Don't dumb things down, but build understanding. Show the right way *and* explain why it's right. Draw analogies to Java/C# when introducing TypeScript (interfaces, generics, async patterns). Pre-ES5 JS background means arrow functions, `const`/`let`, Promises, destructuring, and modules all need brief orientation on first use. The user thinks architecturally — engage that lens when making system-level decisions.

## Planned Tech Stack

- **Database:** PostgreSQL
- **Backend:** TypeScript/Node.js APIs
- **Frontend:** React SPA (Vite) — deployed as static files to Dreamhost shared hosting
- **Auth:** OAuth2 (implemented from scratch across all interfaces)
- **Mobile:** Expo (React Native) — Android primary, iOS secondary; single codebase
- **Hosting:** Dreamhost shared hosting (static files for web; API hosted separately TBD)
- **VCS/CI:** GitHub + GitHub Actions (lint, test, build, security audit on PRs)
- **Docs/Tracking:** Confluence + Jira

## Project Status

Phases 1–3 complete and merged to `main`. Active development branch: `develop`.

- `npm install` complete (1,665 packages)
- Atlassian MCP configured (`.mcp.json`) — Jira + Confluence accessible from Claude Code
- Jira project: **COL** — epics and stories defined, see [docs/dev-sequence.md](docs/dev-sequence.md)
- CI/CD: GitHub Actions running (lint, test, build, security audit); `main` branch protected
- Local DB: PostgreSQL 16 via Docker Compose (`docker compose up -d`); TypeORM migrations configured
- Auth: OAuth2 Authorization Code Flow with PKCE — fully implemented (COL-9)
  - Endpoints: `POST /auth/register`, `GET /auth/authorize`, `POST /auth/login`, `POST /auth/token`, `POST /auth/revoke`
  - Protected endpoint: `GET /users/me` (Bearer JWT required)
  - DB tables: `users`, `oauth_clients`, `authorization_codes`, `refresh_tokens`
  - OAuth clients seeded: `web-app`, `mobile-app`
- Postman collections in `postman/` (committed to git) — one file per API module
- **Next phase: Collections API** — CRUD for Star Wars, Transformers, He-Man items (COL-10)

**Known vulnerability debt:** High-severity issues exist in NestJS 10 (`multer` via `@nestjs/platform-express`) and Expo 51 (`tar`/`send` via `@expo/cli`). No critical-severity issues. Accepted as scaffold risk; address when upgrading to NestJS 11 / Expo 55 before production.

See [docs/setup-log.md](docs/setup-log.md) for the full record of actions taken, commands run, and decisions made each session.

## Repository Structure

```
my-collections/
├── packages/
│   ├── shared/    # @my-collections/shared — TypeScript types used by all packages
│   ├── api/       # @my-collections/api — NestJS REST API + PostgreSQL
│   ├── web/       # @my-collections/web — React SPA (Vite)
│   └── mobile/    # @my-collections/mobile — Expo (React Native)
├── postman/       # Postman collections (one per API module) + dev environment
├── docs/          # Project documentation (see docs/project-structure.md for file reference)
├── turbo.json     # Turborepo build pipeline
├── tsconfig.base.json  # Base TypeScript config extended by all packages
└── package.json   # npm workspaces root
```

See [docs/project-structure.md](docs/project-structure.md) for a detailed explanation of every directory and file.

## Known Environment Quirks

- **`gh` CLI path:** `gh` is not on Claude Code's default PATH. Always invoke as `/opt/homebrew/bin/gh` in Bash tool calls.

## Development Commands

```bash
# Install all workspace dependencies (run from repo root)
npm install

# Run all packages in dev mode simultaneously (via Turborepo)
npm run dev

# Run a single package in dev mode
npm run dev --workspace=packages/api
npm run dev --workspace=packages/web
npm run dev --workspace=packages/mobile

# Build all packages (respects dependency order: shared → api/web/mobile)
npm run build

# Run tests across all packages
npm run test

# Run lint across all packages
npm run lint

# --- Per-package shortcuts ---
# API (NestJS) — http://localhost:3000, Swagger at /api/docs
cd packages/api && npm run dev

# Web (Vite React) — http://localhost:5173
cd packages/web && npm run dev

# Mobile (Expo)
cd packages/mobile && npm run android   # Android emulator
cd packages/mobile && npm run ios       # iOS simulator
```

## Architecture Notes

See [docs/project-structure.md](docs/project-structure.md) for full details. Summary:

- **Shared types** in `packages/shared` are the single source of truth — imported by API, web, and mobile. Always update types here first.
- **NestJS** uses decorators for routing and DI (similar to Spring Boot / ASP.NET Core). Feature modules go under `packages/api/src/modules/`.
- **Auth** uses OAuth2 Authorization Code Flow with PKCE. `JwtAuthGuard` protects routes; `@CurrentUser()` extracts the decoded JWT payload. See `src/modules/auth/` for all auth logic.
- **Postman collections** are committed to `postman/` — add a new collection file for each new API module.
- **Vite dev proxy** forwards `/api/*` to `localhost:3000` — no CORS issues during development.
- **Expo** plugins for camera, barcode scanner, and push notifications are pre-declared in `packages/mobile/app.json`.
- **TypeORM entities:** All properties need the `!` definite assignment assertion (`id!: string`, not `id: string`). TypeScript strict mode requires initialization guarantees; TypeORM populates properties via reflection at runtime, not constructors. Missing `!` causes `migration:generate` to fail with TS2564 errors.
- **ESLint + Jest per package:** Any package that gains tests needs a `tsconfig.eslint.json` extending its build `tsconfig.json` but without the `**/*.spec.ts` exclusion. Point `eslint.config.mjs` `parserOptions.project` at `tsconfig.eslint.json` instead of `tsconfig.json`. Already done for `packages/api/`; repeat for `web` and `mobile` when they get tests.
- **uuid-ossp extension in migrations:** TypeORM generates `uuid_generate_v4()` for UUID PKs but doesn't emit the extension. Any migration that creates tables with UUID PKs must include `await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')` at the top of `up()`, or the migration will fail on a fresh PostgreSQL instance.
- **Library documentation:** Use the Context7 MCP server (`mcp__plugin_context7_context7__resolve-library-id` + `mcp__plugin_context7_context7__query-docs`) to look up live documentation before writing code for any third-party library. Do not rely on training-data knowledge for library APIs — it may be stale or wrong for the specific version in use. This applies especially to NestJS, TypeORM, jsonwebtoken, argon2, and any new library added to the project.
- **CJS workspace packages in Vite:** `packages/shared` compiles to CommonJS (for NestJS compatibility). When web code imports enum *values* (not just types) from `@my-collections/shared`, Vite can't resolve named exports from the CJS `__exportStar` pattern. Fix: `optimizeDeps: { include: ['@my-collections/shared'] }` in `vite.config.ts` — esbuild pre-bundles it to ESM at dev-server start.
- **Vite proxy rewrite required:** NestJS has no global `/api` prefix. The Vite dev proxy must strip it: `rewrite: (path) => path.replace(/^\/api/, '')`. Without this, `/api/auth/authorize` proxies to `localhost:3000/api/auth/authorize` (404).
- **OAuth redirect URI must match seed data exactly:** The PKCE `redirect_uri` in the frontend must exactly match a registered URI in the `oauth_clients` table. Check `packages/api/src/database/seeds/oauth-clients.seed.ts` before hardcoding redirect URIs. Current web value: `http://localhost:5173/auth/callback`.
- **React hooks before early returns:** All hooks (`useQuery`, `useParams`, etc.) must be called before any early `return`. When a component needs to bail on invalid params, use `enabled: !!config` to disable the query rather than returning before the hook.
- **shadcn/ui v4 peer deps:** After `npx shadcn@latest add ...`, some packages need manual install: `class-variance-authority` (required by Button, Badge) and `tw-animate-css` (animation utilities).
- **MCP tool schemas — ToolSearch first:** Before calling any MCP tool for the first time in a session, use `ToolSearch` to fetch its schema. Never guess parameter names. Known gotchas: `createJiraIssue` needs `cloudId` + `issueTypeName`; `transitionJiraIssue` needs `transition` as object `{"id":"21"}` not string; `resolve-library-id` needs both `libraryName` + `query`; `query-docs` uses `libraryId` + `query`.
- **Playwright MCP:** Available for browser smoke testing. Use `browser_snapshot` (accessibility tree) for reading content and finding element refs; use `browser_take_screenshot` for visual confirmation. Dev credentials: `collector@example.com` / check `.env` or `packages/api/src/database/seeds/`.

## Session Close Checklist

At the end of every feature session, before updating Jira or setup-log:

1. **Playwright smoke test** — start servers if needed, run the core flow:
   - Navigate to `http://localhost:5173` → should redirect to `/login`
   - Log in with dev credentials → should land on `/dashboard`
   - Click each collection card → list page loads without console errors
   - Click an item → detail page loads
   - Sign out → returns to `/login`
   - Zero console errors throughout
2. **`npm run lint`** — no new lint errors
3. **Transition Jira tickets** — move completed stories to Done
4. **Append to `docs/setup-log.md`** — what was done, commands run, decisions made
