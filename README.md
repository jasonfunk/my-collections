# My Collections

![Node 20+](https://img.shields.io/badge/Node-20%2B-339933?style=flat-square)
![TypeScript 5.4](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square)
![NestJS 11](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square)
![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Expo 55](https://img.shields.io/badge/Expo-55-000020?style=flat-square)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square)

Personal full-stack app to track vintage toy collections (Star Wars, G1 Transformers, Masters of the Universe). Built as a learning project covering OAuth2 from scratch, React, TypeScript, Expo/React Native, and full SDLC practices — Jira tracking, Confluence docs, CI/CD pipeline, and monorepo tooling.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Database | PostgreSQL | 16 |
| Backend API | NestJS | 11 |
| Frontend | React SPA (Vite) | 18 / Vite 5 |
| Mobile | Expo (React Native) | 55 / RN 0.83.4 |
| Auth | OAuth2 + PKCE | Custom |
| Language | TypeScript | 5.4 |
| Monorepo | Turborepo + npm workspaces | 2.0 |
| CI/CD | GitHub Actions | — |

---

## Project Status

- Phases 1–5 complete: CI/CD, local DB + migrations, OAuth2 auth, Collections API, React SPA with full CRUD (browse, detail, add, edit, wishlist, search)
- Phase 6 (mobile) in progress: login, dashboard, collection browse, and item detail screens complete (COL-47 through COL-49); barcode scanning, camera, add/edit, and push notifications remain
- Active development on `develop` branch; `main` is production-ready

---

## Prerequisites

- **Node.js 20+** — project ships an `.nvmrc` for nvm users
- **Docker Desktop** — PostgreSQL runs via Docker Compose for local dev
- **npm 11+**

---

## Quick Start

```bash
# 1. Clone and switch to the right Node version
git clone <repo-url>
cd my-collections
nvm use  # uses .nvmrc

# 2. Install all workspace dependencies
npm install

# 3. Set up environment variables
cp packages/api/.env.example packages/api/.env
# Edit packages/api/.env — see Environment Variables section below

# 4. Start the database
docker compose up -d

# 5. Start all packages in dev mode
npm run dev
```

Once running:

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/api/docs |
| Web SPA | http://localhost:5173 |

---

## Environment Variables

The API package requires a `.env` file at `packages/api/.env`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | yes | — | Secret for signing JWT access tokens |
| `JWT_ACCESS_EXPIRES_IN` | no | `15m` | Access token TTL (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | no | `30d` | Refresh token TTL (e.g. `7d`, `30d`) |
| `REGISTRATION_ENABLED` | no | `true` | Set to `false` to disable new registrations |

Example `DATABASE_URL` for the local Docker Compose setup:

```
DATABASE_URL=postgresql://my_collections:my_collections_dev@localhost:5432/my_collections
```

---

## Development Commands

**All packages (from repo root):**

```bash
npm run dev      # Start all packages in dev/watch mode
npm run build    # Build all packages (shared → api/web/mobile)
npm run test     # Run tests across all packages
npm run lint     # Lint all packages
npm run clean    # Remove all build artifacts and node_modules

# Data scripts (one-time, run from repo root)
npm run scrape:star-wars  # Scrape transformerland.com → seeds/data/star-wars-catalog.json
                          # Requires: npx playwright install chromium (one-time, ~92 MB)
                          # Opens a browser window during the ~3-minute run (Cloudflare bypass)
```

**Per-package:**

```bash
# API (NestJS) — http://localhost:3000
npm run dev --workspace=packages/api
npm run test --workspace=packages/api
npm run lint --workspace=packages/api

# Web (Vite + React) — http://localhost:5173
npm run dev --workspace=packages/web
npm run test --workspace=packages/web

# Mobile (Expo)
npm run android --workspace=packages/mobile   # Android emulator
npm run ios --workspace=packages/mobile       # iOS simulator

# Shared types
npm run build --workspace=packages/shared     # Compile types
```

**Database migrations (run from `packages/api`):**

```bash
cd packages/api
npm run migration:generate -- src/migrations/MigrationName  # Generate from entity changes
npm run migration:run                                        # Apply pending migrations
npm run migration:revert                                     # Revert last migration
```

---

## Project Structure

```
my-collections/
├── .github/
│   └── workflows/        # CI/CD: ci.yml, build.yml, audit.yml
├── docs/
│   ├── overview.md       # Project goals and rationale
│   ├── dev-sequence.md   # Phased development roadmap
│   ├── project-structure.md  # Detailed file reference
│   └── setup-log.md      # Chronological session journal
├── packages/
│   ├── shared/           # @my-collections/shared — TypeScript types (single source of truth)
│   ├── api/              # @my-collections/api — NestJS REST API
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/         # OAuth2 + PKCE implementation
│   │       │   ├── users/        # User profile endpoints
│   │       │   └── collections/  # Star Wars, Transformers, He-Man CRUD
│   │       ├── database/
│   │       │   ├── migrations/   # TypeORM migrations
│   │       │   └── seeds/        # OAuth client seed + star-wars-catalog.json (199 items)
│   │       └── main.ts
│   ├── web/              # @my-collections/web — React SPA (Vite)
│   │   └── src/
│   │       ├── api/         # fetch wrapper + uploadFile()
│   │       ├── auth/        # OAuth2 flow, PKCE, token storage
│   │       ├── components/
│   │       │   └── collections/
│   │       │       └── forms/  # BaseFormFields + per-collection form fields
│   │       └── pages/       # Route-level components
│   ├── api/
│   │   └── uploads/         # Uploaded item photos (gitignored; served at /uploads/*)
│   └── mobile/           # @my-collections/mobile — Expo (React Native)
├── postman/              # Postman collections (auth, users, collections) + dev environment
├── scripts/              # One-off utility scripts (Star Wars scraper, data patches)
├── docker-compose.yml    # PostgreSQL 16 for local development
├── turbo.json            # Turborepo pipeline config
├── tsconfig.base.json    # Base TypeScript config extended by all packages
├── tsconfig.scripts.json # CJS override for ts-node scripts
└── package.json          # npm workspaces root
```

See [`docs/project-structure.md`](docs/project-structure.md) for a detailed breakdown of every file.

---

## API Overview

**Base URL:** `http://localhost:3000`  
**Swagger UI:** `http://localhost:3000/api/docs`  
**Auth:** OAuth2 Authorization Code Flow + PKCE

| Module | Endpoints | Auth Required |
|---|---|---|
| Auth | POST /auth/register, GET /auth/authorize, POST /auth/login, POST /auth/token, POST /auth/revoke | No |
| Users | GET /users/me | Yes (Bearer JWT) |
| Collections | GET /collections/stats, GET /collections/search | Yes |
| Star Wars Catalog | GET /collections/star-wars/catalog, GET /collections/star-wars/catalog/:id | Yes |
| Star Wars Items | GET/POST /collections/star-wars/items, GET/PATCH/DELETE /collections/star-wars/items/:id | Yes |
| Transformers | GET/POST /collections/transformers/items, GET/PATCH/DELETE /collections/transformers/items/:id | Yes |
| He-Man | GET/POST /collections/he-man/items, GET/PATCH/DELETE /collections/he-man/items/:id | Yes |
| Photos | POST /collections/photos/upload | Yes (Bearer JWT) |
| Health | GET /health, GET /health/ready | No |

All three collection list endpoints support query params: `search` (name/notes, case-insensitive), `acquisitionSource`, `isComplete`, `owned`, `condition`, plus collection-specific `line`/`faction`. The global `GET /collections/search` endpoint adds `q`, `collectionType`, `isOwned`, `isComplete`, and `condition` filters across all three tables simultaneously.

Postman collections are in `postman/` — import `postman/environment.json` and the relevant collection file.

---

## Testing

```bash
npm run test                            # All packages
npm run test --workspace=packages/api   # Jest (NestJS)
npm run test --workspace=packages/web   # Vitest (React)
```

API integration tests require the database to be running (`docker compose up -d`).

---

## CI/CD

Three GitHub Actions workflows run automatically:

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | PRs to `main` / `develop` | Lint + test all packages |
| `build.yml` | Push to `main` | Full build verification |
| `audit.yml` | PRs + weekly (Monday) | `npm audit --audit-level=critical` |

Branch protection on `main`: all CI checks must pass before merge.

---

## Known Issues

> **Vulnerability debt:** No high-severity vulnerabilities as of NestJS 11 + Expo 55 upgrade (2026-04-12). Residual moderate-severity issues exist in test infrastructure dependencies only. CI is configured to `--audit-level=critical` — these do not block builds.

---

## Contributing

- Create feature branches from `develop`
- PR to `develop`; `develop` merges to `main` via PR when a phase is complete
- `main` is protected — direct pushes are blocked
- Follow the session close checklist in [`CLAUDE.md`](CLAUDE.md) before marking work done
