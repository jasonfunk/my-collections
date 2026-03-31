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

Phase 1 (Infrastructure & CI/CD) complete and merged to `main`. Active development branch: `develop`.

- `npm install` complete (1,665 packages)
- Atlassian MCP configured (`.mcp.json`) — Jira + Confluence accessible from Claude Code
- Jira project: **COL** — epics and stories defined, see [docs/dev-sequence.md](docs/dev-sequence.md)
- CI/CD: GitHub Actions running (lint, test, build, security audit); `main` branch protected
- **Next phase: Local Dev Environment** — PostgreSQL + Docker Compose + TypeORM (COL-8)

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
├── docs/          # Project documentation (see docs/project-structure.md for file reference)
├── turbo.json     # Turborepo build pipeline
├── tsconfig.base.json  # Base TypeScript config extended by all packages
└── package.json   # npm workspaces root
```

See [docs/project-structure.md](docs/project-structure.md) for a detailed explanation of every directory and file.

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
- **Vite dev proxy** forwards `/api/*` to `localhost:3000` — no CORS issues during development.
- **Expo** plugins for camera, barcode scanner, and push notifications are pre-declared in `packages/mobile/app.json`.
