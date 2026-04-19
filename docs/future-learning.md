# Future Learning Goals

Things to revisit when there's time to go deeper — not just read explanations, but actually write code with real-time guidance.

---

## Active Understanding Sessions (VS Code + Claude Code)

The goal is to shift from "Claude drives, I review" to "I drive, Claude explains in real-time." Install the Claude Code VS Code extension and pick a topic below. Write the code yourself — use Claude to answer *why* questions mid-keystroke, not to generate the implementation.

### High-value topics in this codebase

**OAuth2 flow**
- Files: `packages/api/src/modules/auth/auth.controller.ts`, `token.service.ts`
- Why: Walking a token exchange line by line (authorize → login → token → refresh → revoke) would solidify the protocol at the implementation level, not just conceptually.

**TypeORM relations**
- Files: `packages/api/src/modules/auth/entities/`, `packages/api/src/modules/collections/entities/`
- Why: The catalog/user-items split uses `@ManyToOne`, `@OneToMany`, FK constraints, and cascade rules. Understanding the entity graph deeply makes schema changes intuitive rather than trial-and-error.

**TanStack Query**
- Files: `packages/web/src/pages/collections/StarWarsCatalogPage.tsx` and detail pages
- Why: These pages demonstrate cache invalidation, dependent queries (`enabled: !!id`), and optimistic updates together. Good mental model for all async UI work going forward.

**NestJS DI + module system**
- Files: `packages/api/src/app.module.ts` and any feature module
- Why: The decorator-based DI (similar to Spring Boot / ASP.NET Core) is the backbone of the whole API. Understanding how providers, imports, and exports wire together removes the "magic" from the framework.

---

## Natural Trigger

**When the Mac Mini arrives and Phase 6 (mobile) begins** — build the first Expo screen yourself with Claude explaining rather than driving. Mobile is a clean slate with no existing patterns to follow, which makes it ideal for an active learning session.
