# Mac Mini Setup Log

Chronological record of all actions taken to configure the my-collections Mac Mini server.
Follow the same format as `docs/setup-log.md`. Append a new session entry after every work session.

See `devops/CLAUDE.md` for server architecture, inventory checklist, and common commands.
See `devops/runbook.md` for the human-facing provisioning steps (initial macOS setup, Cloudflare Tunnel, GitHub Actions runner).

---

## Session 1 — 2026-05-13

Installed and configured the full application stack on the Mac Mini. Set up staging environment
first, validated end-to-end, then set up production. Also discovered and fixed a bug in the web
frontend (`AuthContext.tsx` used hardcoded relative API paths that broke in any deployed env).

### 1. Install nvm and Node.js v20 LTS

**Command:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# (in a new shell with NVM_DIR sourced)
nvm install 20 && nvm alias default 20
```

**What it does:** Installs nvm 0.39.7 to `~/.nvm` and appends the init block to `~/.zprofile`.
Then installs Node.js v20.20.2 (LTS) and sets it as the default.

**Why:** nvm pins Node to a specific LTS version independently of Homebrew, preventing surprise
upgrades when Homebrew updates. Non-interactive SSH sessions must prefix commands with
`source ~/.zprofile` to pick up the nvm PATH.

### 2. Install PostgreSQL 16

**Command:**
```bash
brew install postgresql@16
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zprofile
brew services start postgresql@16
```

**What it does:** Installs PostgreSQL 16.13, adds the bin to PATH in `~/.zprofile`, and starts
the service as a Homebrew LaunchAgent (restarts on login automatically).

**Why:** Homebrew manages the service lifecycle cleanly on macOS. The explicit PATH entry is
needed because Homebrew installs versioned formulae to a non-default location.

### 3. Create databases and app user

**Command:**
```bash
createdb my_collections
createdb my_collections_stage
psql postgres -c "CREATE USER my_collections WITH PASSWORD '<password>';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE my_collections TO my_collections;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE my_collections_stage TO my_collections;"
psql postgres -c "ALTER DATABASE my_collections OWNER TO my_collections;"
psql postgres -c "ALTER DATABASE my_collections_stage OWNER TO my_collections;"
```

**What it does:** Creates both the production and staging databases, creates the app user with a
generated password, grants full access, and transfers ownership.

**Why:** Both databases created up-front so either environment can be set up in any order.
DB password generated with `openssl rand -hex 16`; stored in each environment's `.env`.

### 4. Clone repos

**Command:**
```bash
mkdir -p ~/Sites
git clone https://github.com/jasonfunk/my-collections.git my-collections-stage  # defaults to develop
git clone https://github.com/jasonfunk/my-collections.git                         # then switch to main
cd ~/Sites/my-collections && git checkout main
```

**What it does:** Clones the repo twice — staging stays on `develop`, production is switched to
`main`.

**Why:** `develop` is the GitHub default branch, so cloning without specifying a branch gives
`develop`. Production must be on `main`; an explicit `git checkout main` is required.

### 5. Install dependencies and build (staging)

**Command:**
```bash
cd ~/Sites/my-collections-stage && npm ci
npm run build -- --filter=@my-collections/api
```

**What it does:** Installs all workspace dependencies from `package-lock.json`, then builds only
`@my-collections/shared` and `@my-collections/api`. Turborepo resolves the dependency graph and
builds shared first.

**Why:** `--filter=@my-collections/api` is required on the server. Without it, Turborepo also
tries to build `@my-collections/mobile`, which runs `expo export` and fails because
`react-native-web` is not installed server-side.

### 6. Create staging `.env`

**Command:**
```bash
# Written to ~/Sites/my-collections-stage/packages/api/.env
# PORT=3001, NODE_ENV=production, DATABASE_URL pointing to my_collections_stage
# JWT and COOKIE secrets generated fresh (different from production)
```

**What it does:** Creates the environment file for the staging API process.

**Why:** Staging runs on port 3001. `NODE_ENV=production` disables Swagger docs and switches to
JSON log format. Fresh JWT/COOKIE secrets mean a staging-issued token cannot authenticate
against production.

### 7. Run TypeORM migrations (staging)

**Command:**
```bash
cd ~/Sites/my-collections-stage/packages/api && npm run migration:run
```

**What it does:** Runs all 10 pending migrations against `my_collections_stage`.

**Why:** Must `cd` to `packages/api/` first — migration scripts are defined in that package's
`package.json`. Running from repo root gives "Missing script" error.

### 8. Seed OAuth clients and catalog data (staging)

**Command:**
```bash
# OAuth clients (CWD-sensitive — must run from packages/api/):
cd ~/Sites/my-collections-stage/packages/api
npx ts-node --project tsconfig.json src/database/seeds/oauth-clients.seed.ts

# Catalog seeds (CWD-insensitive — run from repo root):
cd ~/Sites/my-collections-stage
npm run seed:star-wars      # 199 records
npm run seed:transformers   # 443 records
npm run seed:he-man         # 127 records
```

**What it does:** Populates oauth_clients with web-app and mobile-app clients (production redirect
URIs already updated), and fills the three catalog tables with all known figures.

**Why:** `oauth-clients.seed.ts` calls `dotenv.config()` with no path — reads `.env` from CWD,
so CWD must be `packages/api/`. Catalog seeds resolve `.env` via `__dirname` so CWD is irrelevant.
`npx` is needed because `ts-node` is a workspace devDependency, not a global binary.

### 9. Install pm2 and start staging API

**Command:**
```bash
npm install -g pm2
cd ~/Sites/my-collections && pm2 start ecosystem.config.js --only my-collections-api-stage
```

**What it does:** Installs pm2 7.0.1 globally and starts the staging process from the committed
`ecosystem.config.js`.

**Why:** First attempt failed — original `ecosystem.config.js` had `cwd` set to the repo root.
`ConfigModule.forRoot()` reads `.env` from CWD; with repo root as CWD it found nothing and the
app entered an immediate crash-restart loop (visible as 43 restarts, no error in stderr).
Fix: `cwd` changed to `packages/api/` in `ecosystem.config.js`.

### 10. Staging smoke test

**Command:**
```bash
curl -s https://stage-api.houseoffunk.net/health/ready | jq .
# → { "status": "ready", "db": "ok" }
curl -s -X POST https://stage-api.houseoffunk.net/auth/register \
  -H "Content-Type: application/json" -d '{}' | jq .
# → 400 validation error (confirms API is routing correctly, not 502/404)
```

**What it does:** Verifies the staging API is reachable through the Cloudflare Tunnel and that
the database connection is healthy.

### 11. Create staging account and Playwright validation

**Command:**
```bash
curl -s -X POST https://stage-api.houseoffunk.net/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"collector@example.com","password":"jason-testing-collections"}'
# → isApproved: false (expected — DB default changed in migration)

psql "postgresql://my_collections:<pw>@localhost:5432/my_collections_stage" \
  -c "UPDATE users SET \"isApproved\" = true WHERE email = 'collector@example.com';"
```

**What it does:** Registers the staging account and approves it directly in the database
(new users are created with `isApproved: false` by default since migration
`UserIsApprovedDefaultFalse`).

**Why staging credentials:** `collector@example.com` / `jason-testing-collections` — consistent
with the dev environment so Playwright tests don't need credential changes.

**Playwright result:** Login attempt exposed a second bug — `AuthContext.tsx` used hardcoded
`/api/auth/...` relative paths that worked in local dev (via Vite proxy) but resolved to the
Dreamhost frontend origin in production. Fixed in PR #39 — all six auth `fetch` calls now use
`${API_ORIGIN}/api/...`. Staging Playwright validation pending the staging frontend redeploy.

<!-- TODO: append production setup, pm2 startup, reboot test results when complete -->

