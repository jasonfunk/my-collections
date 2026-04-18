# my-collections Project Overview

## Purpose
Personal full-stack app to track collectible toy collections (Star Wars, G1 Transformers, He-Man, etc.). Also a learning project for the owner.

## Tech Stack
- **Backend**: NestJS (TypeScript), PostgreSQL via TypeORM, deployed separately
- **Frontend**: React SPA (Vite), deployed as static files to Dreamhost
- **Mobile**: Expo (React Native), Android primary
- **Auth**: OAuth2 Authorization Code Flow with PKCE (custom implementation)
- **CI/CD**: GitHub Actions (lint, test, build, security audit)
- **Docs/Tracking**: Jira (project: COL) + Confluence

## Monorepo Structure (npm workspaces + Turborepo)
- `packages/shared` — TypeScript types, single source of truth
- `packages/api` — NestJS REST API (port 3000), Swagger at /api/docs
- `packages/web` — React SPA (Vite, port 5173)
- `packages/mobile` — Expo React Native
- `postman/` — Postman collections (one per API module)
- `docs/` — project docs

## Key Commands
```bash
npm run dev                          # all packages
npm run dev --workspace=packages/api # single package
npm run test                         # all tests
npm run lint                         # all lint
npm run build                        # all packages
```

## Architecture Notes
- NestJS modules under `packages/api/src/modules/`
- JwtAuthGuard is per-route (not global) — unguarded routes are public
- ThrottlerGuard is global via APP_GUARD
- TypeORM entities need `!` definite assignment assertions
- UUID PKs need `uuid-ossp` extension in migrations
