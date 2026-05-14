# Mac Mini Setup Log

Chronological record of all actions taken to configure the my-collections Mac Mini server.
Follow the same format as `docs/setup-log.md`. Append a new session entry after every work session.

---

## Session 3 — 2026-05-14

### 1. Add `.htaccess` SPA routing rule to both Dreamhost frontends (COL-124)

**Command:** Created `packages/web/public/.htaccess`:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```
Committed to `packages/web/public/` and merged via PR #50 (`feature/col-124-125-htaccess-spa` → `develop`).

**What it does:** Tells Apache to serve `index.html` for any path that doesn't map to a real file. This lets React Router handle client-side routes on page refresh or direct navigation.

**Why `public/` and not Dreamhost directly:** Both deploy workflows use `rsync --delete`, which wipes Dreamhost to exactly what's in `dist/`. A file placed manually on Dreamhost would be deleted on the next deploy. Placing it in `public/` means Vite copies it to `dist/` on every build, so it ships automatically with every future deploy.

---

### 2. Redeploy staging frontend and run Playwright E2E validation (COL-125)

**Command:** Merging PR #50 into `develop` triggered `deploy-web-stage.yml` automatically. Playwright MCP used to validate `https://stage.houseoffunk.net`:
- Navigate to root → redirected to `/login` ✓
- Log in (`collector@example.com` / staging password) → `/dashboard` ✓
- Click Star Wars card → `/collections/star-wars` loads (199 items) ✓
- Direct navigation to `/collections/star-wars` → React app served (not 404) ✓

**What it does:** Confirms the `.htaccess` rewrite is active — direct navigation to a deep route returns the React app rather than an Apache 404.

---

### 3. Fix cross-origin session restoration — `credentials: 'include'` on all auth fetches (COL-125)

**Problem discovered during validation:** Page refresh always redirected to login even after a valid session. Root cause: three `fetch` calls in `AuthContext.tsx` were missing `credentials: 'include'`, so the browser never stored or sent the httpOnly refresh-token cookie across subdomains (`stage.houseoffunk.net` → `stage-api.houseoffunk.net`).

In local dev this didn't surface because the Vite proxy makes the API same-origin — `credentials: 'same-origin'` (the browser default) is sufficient. In production the two subdomains are cross-origin, so cookies require explicit opt-in.

**Fix:** Added `credentials: 'include'` to all three `/auth/token` interactions:

| Call | Role |
|---|---|
| `authorization_code` exchange (login) | Browser must **store** the `Set-Cookie` response |
| `refresh_token` grant (page load) | Browser must **send** the stored cookie |
| `revoke` (logout) | Browser must **send** the cookie to invalidate it |

PRs: #51 (refresh + revoke), #52 (authorization_code exchange). Both merged into `develop`.

**Why it's safe:** `credentials: 'include'` is a client-side instruction — the server's CORS config (`ALLOWED_ORIGINS`) is the enforcer. Only the two configured Dreamhost origins can complete credentialed requests. `SameSite=Strict` on the cookie also blocks any cross-site (different eTLD+1) requests.

---

### 4. Deploy to production (COL-124 + COL-125)

**Command:** PR #53 (`develop` → `main`) merged. GitHub Actions ran two workflows:
- **Build #41** — compiled all packages, confirmed green ✓
- **Deploy Web #4** — rsync'd `dist/` (including `.htaccess` and updated `AuthContext.tsx`) to `collections.houseoffunk.net` ✓

Both COL-124 and COL-125 transitioned to Done in Jira.

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

---

## Session 2 — 2026-05-14

Set up the production environment (`~/Sites/my-collections`, `my_collections` DB, port 3000).
All infrastructure (nvm, Node.js 20, PostgreSQL 16, pm2) was already in place from Session 1.
Validated with Playwright E2E test and confirmed auto-start after reboot.

### 1. Pull latest `main` into production clone

**Command:**
```bash
# First removed untracked ecosystem.config.js (manually created in Session 1, now committed)
rm ~/Sites/my-collections/ecosystem.config.js
git -C ~/Sites/my-collections pull origin main
```

**What it does:** Syncs the production clone with `main`, bringing in the committed
`ecosystem.config.js`, the `AuthContext.tsx` fix (PR #39), and deploy workflow updates.

**Why:** The production clone was on an older commit. The untracked `ecosystem.config.js`
blocked the pull — it was created manually in Session 1 before being committed to the repo.
The committed version uses `${__dirname}` for the production path (more portable); the
manually-created one had a hardcoded absolute path. Both point to the same location.

### 2. Install dependencies and build

**Command:**
```bash
source ~/.zprofile && cd ~/Sites/my-collections && npm ci
npm run build -- --filter=@my-collections/api
```

**What it does:** Installs all workspace dependencies from `package-lock.json` (1,597 packages),
then builds `@my-collections/shared` and `@my-collections/api` via Turborepo.

**Why:** `npm ci` uses the lockfile exactly — no version drift. `--filter` is required; without
it the mobile build fails on the server (no `react-native-web`).

### 3. Create production `.env`

**Command:**
```bash
# Get DB password (shared PostgreSQL user — same password for both DBs):
grep DATABASE_URL ~/Sites/my-collections-stage/packages/api/.env

# Generate fresh secrets:
openssl rand -hex 64   # JWT_ACCESS_SECRET
openssl rand -hex 64   # JWT_REFRESH_SECRET (different value)
openssl rand -hex 32   # COOKIE_SECRET

# Write ~/Sites/my-collections/packages/api/.env:
# PORT=3000, NODE_ENV=production, DATABASE_URL (my_collections DB, not stage)
# Fresh JWT and cookie secrets (different from staging — tokens can't cross environments)
# REGISTRATION_ENABLED=true, ALLOWED_ORIGINS=https://collections.houseoffunk.net
```

**What it does:** Creates the environment file for the production API process.

**Why:** `my_collections` PostgreSQL user is instance-wide — one password covers both databases.
JWT/cookie secrets are generated fresh so a staging-issued token is worthless in production.
`PORT=3000` (staging is 3001). `NODE_ENV=production` disables Swagger docs and switches to
JSON log format.

### 4. Run TypeORM migrations

**Command:**
```bash
source ~/.zprofile && cd ~/Sites/my-collections/packages/api && npm run migration:run
```

**What it does:** Ran all 10 pending migrations against the fresh `my_collections` database.

**Why:** Fresh database — no migrations had been applied. CWD must be `packages/api/` because
migration scripts are defined in that package's `package.json`.

### 5. Seed OAuth clients

**Command:**
```bash
source ~/.zprofile && cd ~/Sites/my-collections/packages/api
npx ts-node --project tsconfig.json src/database/seeds/oauth-clients.seed.ts
```

**What it does:** Created `web-app` and `mobile-app` OAuth clients in the production database.

**Why:** CWD-sensitive — `dotenv.config()` reads `.env` from CWD. Redirect URIs for production
(`https://collections.houseoffunk.net/auth/callback`) were already in the seed file from
Session 1's pre-production code changes.

### 6. Seed catalog data

**Command:**
```bash
source ~/.zprofile && cd ~/Sites/my-collections
npm run seed:star-wars    # 199 records
npm run seed:transformers # 443 records
npm run seed:he-man       # 127 records
```

**What it does:** Populated all three catalog tables with the full known figure sets.

**Why:** Catalog seeds use `__dirname`-relative `.env` paths so CWD doesn't matter, but repo
root is conventional. All seeds are insert-only (skip existing rows) — safe to re-run.

### 7. Start production API via pm2

**Command:**
```bash
source ~/.zprofile && cd ~/Sites/my-collections
pm2 start ecosystem.config.js --only my-collections-api
```

**What it does:** Started the `my-collections-api` process (port 3000) using the committed
`ecosystem.config.js` with `cwd: packages/api/` and `script: dist/main.js`.

**Why:** The `--only` flag starts just production; staging was already running. Both processes
show as `online` in `pm2 status` after this step.

### 8. Configure pm2 auto-start (launchd)

**Command:**
```bash
# pm2 startup generated the plist template and partially wrote the file (owned by root):
source ~/.zprofile && pm2 startup  # prints command; ran with sudo interactively
# pm2 ran as root and wrote the plist, but failed at the mkdir step (PATH issue)
# Loaded the written plist manually (no sudo needed for LaunchAgents):
launchctl load -w ~/Library/LaunchAgents/pm2.jfunk.plist
source ~/.zprofile && pm2 save
```

**What it does:** Registers pm2 as a launchd LaunchAgent that resurrects all saved processes
on login. `pm2 save` serializes the process list to `~/.pm2/dump.pm2`.

**Why:** Without the launchd agent, pm2 doesn't start after a reboot. The `pm2 startup`
command partially succeeded — it wrote the plist (as root, since sudo was required) but
failed at the `mkdir` step because `\$PATH` was escaped and `mkdir` wasn't on PATH. The
plist was already written to `~/Library/LaunchAgents/pm2.jfunk.plist` and correct. LaunchAgents
are user-space services and don't need sudo to load. The PATH in the plist has a literal
`$PATH` prefix (launchd doesn't expand shell variables), but the explicit nvm bin path
(`/Users/jfunk/.nvm/versions/node/v20.20.2/bin`) is appended and that's sufficient since
both the pm2 binary and node are invoked with absolute paths.

### 9. Create and approve production account

**Command:**
```bash
# User registered via curl on the Mac Mini (credentials not exposed in this log)
# Approved the account:
psql 'postgresql://my_collections:...@localhost:5432/my_collections' \
  -c "UPDATE users SET \"isApproved\" = true WHERE email = 'jfunk@jasonfunk.com';"

# Disabled registration:
sed -i '' 's/REGISTRATION_ENABLED=true/REGISTRATION_ENABLED=false/' \
  ~/Sites/my-collections/packages/api/.env
pm2 restart my-collections-api
pm2 save
```

**What it does:** Created and approved the production user account, then locked registration
so no other accounts can be created.

**Why:** New users are created with `isApproved: false` (migration `UserIsApprovedDefaultFalse`).
Manual DB approval is required after registration. `REGISTRATION_ENABLED=false` prevents
anyone else from registering — this is a single-user personal app.

### 10. Smoke test and Playwright E2E validation

**Command:**
```bash
curl -s https://api.houseoffunk.net/health/ready | jq .
# → { "status": "ready", "db": "ok" }
```

**Playwright E2E results** (via Playwright MCP against `https://collections.houseoffunk.net`):
- Login → dashboard: ✅
- Star Wars list (199 items, catalog images): ✅
- Star Wars item detail (2-1B / Two-Onebee): ✅
- Transformers list (443 items): ✅
- He-Man list (127 items): ✅
- Sign out → `/login`: ✅
- Console errors: only expected `/auth/token` 400 on init (OAuth code exchange with no code)

**Known issue discovered:** Direct URL navigation to any route other than `/` returns 404
on Dreamhost (static file server, no `.htaccess` SPA rewrite configured). Add `.htaccess`
with `RewriteRule ^ index.html [QSA,L]` to the Dreamhost web root. See Known Gotchas in
`devops/CLAUDE.md`.

### 11. Reboot test

**Command:**
```bash
# User ran: ssh -t mini.houseoffunk.net "sudo reboot"
# After ~75s, polled until healthy:
until curl -s https://api.houseoffunk.net/health/ready | jq -e '.status == "ready"'; do sleep 5; done
curl -s https://api.houseoffunk.net/health/ready | jq .
curl -s https://stage-api.houseoffunk.net/health/ready | jq .
ssh mini.houseoffunk.net "source ~/.zprofile && pm2 status"
```

**Result:**
- Both APIs returned `{ "status": "ready", "db": "ok" }` without manual intervention.
- `pm2 status` showed both processes `online` with 0 restarts, ~48s uptime.

**Why:** Confirms the launchd agent is correctly configured and pm2 resurrects both processes
on login after a power cycle.

