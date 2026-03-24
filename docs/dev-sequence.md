# Development Sequence

Recommended build order for the My Collections project. Each phase is designed to unblock the next — skipping ahead creates dependencies on things that don't exist yet.

Track progress in Jira project **COL**. See [setup-log.md](./setup-log.md) for the historical record of completed work.

---

## Phase 1 — Infrastructure & CI/CD

**Do this first.** Setting up quality gates before writing feature code means every subsequent commit is automatically validated. It's much harder to add CI retroactively to a project with existing failing tests or lint violations.

**What gets built:**
- GitHub branch protection rules for `main` and `develop` (require PR + passing checks to merge)
- GitHub Actions workflow: lint + TypeScript type check on every PR
- GitHub Actions workflow: run tests on every PR
- GitHub Actions workflow: build verification on push to `main`
- `npm audit` check in CI (flags new high-severity vulnerabilities)

**Why the order matters:** `main` should be protected from direct pushes before any real development starts. The CI pipeline enforces this automatically.

---

## Phase 2 — Local Dev Environment

**Nothing can be built without a running database.** This phase makes the API runnable end-to-end on a local machine.

**What gets built:**
- PostgreSQL installed and running locally
- Docker Compose file for the local database (so setup is repeatable and documented)
- TypeORM connection configured in NestJS (`DATABASE_URL` from `.env`)
- Database migration infrastructure (TypeORM migrations, not `synchronize: true`)
- Initial schema migration (empty — just proves migrations work)

**Why Docker Compose for the DB:** Avoids "works on my machine" problems. Any developer (or future CI job) can spin up an identical database with `docker compose up`.

**Why migrations over `synchronize: true`:** TypeORM's `synchronize: true` auto-modifies the schema on startup — dangerous in production and teaches bad habits. Migrations are explicit, reviewable, and reversible. Think of them like version control for the database schema.

---

## Phase 3 — Authentication (OAuth2)

**Implement before any protected endpoints.** If you build the API first and bolt on auth later, you'll touch every endpoint twice. Auth-first means every feature is protected from the start.

**This is a deliberate learning milestone** — OAuth2 is implemented from scratch, not by dropping in a library like Passport or Auth0. The goal is to understand the protocol, not just use it.

**What gets built:**
- Architecture decision record documenting the OAuth2 authorization code flow
- OAuth2 authorization server configuration in NestJS
- Access token issuance (JWT) and secure storage
- Token refresh flow
- JWT auth guards and decorators on protected NestJS routes
- OAuth2 login flow in the React web app
- OAuth2 login flow in the Expo mobile app

**Key concept:** OAuth2 authorization code flow involves three parties — the client (web/mobile app), the authorization server (issues tokens), and the resource server (the API). Understanding this triangle is the foundation for everything that follows.

---

## Phase 4 — Collections API

**Core feature development.** Each collection type (Star Wars, Transformers, He-Man) becomes a self-contained NestJS feature module. The first one (Star Wars) establishes the pattern; subsequent ones follow it.

**What gets built:**
- Star Wars figures module: NestJS controller + service + TypeORM entity + DTOs
- Transformers module (same pattern)
- He-Man / Masters of the Universe module (same pattern)
- Photo upload and storage endpoints
- Search and filtering endpoints (by condition, acquisition source, completeness, etc.)
- Wishlist management (items marked `isOwned: false`)
- Value tracking and estimate endpoints

**Why Star Wars first:** It has the most variant complexity (cardback styles, double-telescoping lightsabers, etc.) — proving the data model handles the hardest case first means the others are straightforward.

---

## Phase 5 — Web App

**Build after the API is stable enough to develop against.** The React SPA consumes the API — building the frontend in parallel with a changing API means constant rework. Wait until Phase 4 has at least the Star Wars module working end-to-end.

**What gets built:**
- React Router page and layout structure
- Collection dashboard (counts, recent additions, value summary)
- Collection list/grid view with filtering and sorting
- Item detail page (full condition info, photos, accessories, variant notes)
- Add/edit item form with photo upload
- Wishlist page
- Search UI with filter panel
- OAuth2 authentication flow (login, logout, token refresh)

**Deployment:** `npm run build` in `packages/web` outputs static files to `dist/` — uploaded to Dreamhost shared hosting via FTP or CI.

---

## Phase 6 — Mobile App

**Shares the same API as the web app.** By this point the API is fully functional and authenticated — the mobile app is a second client consuming the same endpoints with a native UI and device-specific features.

**What gets built:**
- Expo Router navigation structure (tab bar + stack navigators)
- Home/dashboard screen
- Collection browse screen with filtering
- Item detail screen
- **Barcode scanning** — scan original toy packaging to look up catalogue data
- **Camera capture** — photograph items directly within the app
- Add/edit item screen
- Push notifications for wishlist price alerts

**The differentiator from the web app:** Camera + barcode scanning. The ability to scan a figure's original packaging barcode and auto-populate catalogue data (name, year, accessories list) is a killer feature for a collector app and only possible on mobile.

---

## Cross-Cutting Concerns (ongoing throughout all phases)

These aren't phases — they run alongside everything else:

| Concern | Approach |
|---|---|
| **Shared types** | Update `packages/shared` first whenever the data model changes. API, web, and mobile all import from here. |
| **Documentation** | Append to `docs/setup-log.md` after every session. Update `docs/project-structure.md` when new files are added. |
| **Jira tracking** | Create and update COL stories as work is picked up and completed. |
| **Confluence** | Architecture decisions (OAuth2 flow, schema design) documented in Confluence as ADRs (Architecture Decision Records). |
| **Testing** | Unit tests alongside each NestJS service. Integration tests for API endpoints. Component tests for critical React UI. |
