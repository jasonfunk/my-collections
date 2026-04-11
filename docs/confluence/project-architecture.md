---
confluence_page_id: "3670018"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3670018"
title: "My Collections — Project Architecture"
last_updated: "2026-04-10"
---

## Tech Stack

| **Layer** | **Technology** | **Version** |
| --- | --- | --- |
| Database | PostgreSQL | 16 |
| Backend | NestJS | 10 |
| Frontend | React SPA (Vite) | 18 / Vite 5 |
| Mobile | Expo (React Native) | 51 / RN 0.74 |
| Auth | OAuth2 + PKCE | Custom implementation |
| Language | TypeScript | 5.4 |
| Monorepo | Turborepo + npm workspaces | 2.0 |
| CI/CD | GitHub Actions | — |
| Hosting | Dreamhost shared hosting (web); Mac Mini M4 self-hosted via Cloudflare Tunnel (API) | — |

## Monorepo Structure

The repository is organized as an npm workspace monorepo managed by Turborepo. It contains four packages:

- `@my-collections/shared` — TypeScript types only. Compiles to CommonJS for NestJS compatibility. Single source of truth for all shared types across API, web, and mobile.
- `@my-collections/api` — NestJS REST API. Connects to PostgreSQL via TypeORM. Runs on port 3000. Swagger UI at `/api/docs`.
- `@my-collections/web` — React 18 SPA (Vite 5). Deployed as static files to Dreamhost shared hosting. Runs on port 5173 in development.
- `@my-collections/mobile` — Expo 51 React Native. Android is the primary target; iOS is secondary. Single codebase for both platforms.

Build order is enforced by Turborepo: `shared` builds first, then `api`, `web`, and `mobile` in parallel.

## Database

- PostgreSQL 16 via Docker Compose for local development
- TypeORM with migrations — `synchronize: true` is never used; `migrationsRun: true` on startup
- Five migrations: `InitialSchema`, `AuthSchema`, `CollectionsSchema`, `CatalogRefactorSchema`, `AddToyStoreSource`
- Auth tables: `users`, `oauth_clients`, `authorization_codes`, `refresh_tokens`
- Catalog tables (pre-populated reference data): `star_wars_catalog`, `g1_transformers_catalog`, `masters_catalog`
- User item tables (personal collection records): `user_star_wars_items`, `user_g1_transformers_items`, `user_masters_items`

## GitHub Actions CI/CD

Three workflows run in GitHub Actions:

- `ci.yml` — Runs on PRs to `main` and `develop`: lint all packages + test all packages
- `build.yml` — Runs on push to `main`: builds all packages except mobile (mobile is type-checked via lint)
- `audit.yml` — Runs on PRs and weekly: `npm audit --audit-level=critical --omit=dev`

Branch protection on `main` requires all CI checks to pass before merge.

## Hosting

- **Web app:** Deployed as static files to Dreamhost shared hosting. The Vite build (`npm run build`) outputs to `packages/web/dist/` — upload that directory to Dreamhost via SFTP or CI.
- **API:** Self-hosted on a Mac Mini M4 at home. Exposed to the public internet via Cloudflare Tunnel (no open inbound ports on the home router). The GitHub Actions self-hosted runner on the Mac Mini handles CI/CD deploys. See the Infrastructure Overview and Server Setup Runbook pages for full details.
- **Local dev:** `docker compose up -d` starts PostgreSQL 16 on port 5432. `npm run dev` starts all packages via Turborepo. The `devops/` directory contains context files and a setup log for the Mac Mini.

## Known Vulnerability Debt

High-severity issues exist in NestJS 10 (`multer` via `@nestjs/platform-express`) and Expo 51 (`tar`/`send` via `@expo/cli`). No critical-severity issues. These are accepted as scaffold risk and will be addressed when upgrading to NestJS 11 / Expo 55 before production deployment.
