# Mac Mini Setup Log

Chronological record of all actions taken to configure the my-collections Mac Mini server.
Follow the same format as `docs/setup-log.md`. Append a new session entry after every work session.

---

## Session 3 (continued) — 2026-05-14

### 5. Version tracking for API and web SPA (COL-126)

**Changes:**
- Bumped `packages/api/package.json` and `packages/web/package.json` to `1.0.0` (MVP production release)
- `GET /health` now returns `{ status, timestamp, version }` — version imported from `package.json` at runtime via `resolveJsonModule`. `process.env.npm_package_version` was intentionally avoided: pm2 runs the compiled JS directly (not through npm) so that env var is `undefined` in production.
- `packages/web/vite.config.ts` injects `__APP_VERSION__: JSON.stringify(version)` as a Vite `define` constant — baked into the SPA at build time, no runtime fetch needed for the web version.
- `packages/web/src/vite-env.d.ts` declares `const __APP_VERSION__: string` so TypeScript recognises the constant.
- Dashboard footer added to `DashboardPage.tsx`: `SPA v{__APP_VERSION__} · API v{healthQuery.data?.version ?? '…'}`. API version is fetched once per session from `GET /health` with `staleTime: Infinity`.
- Versioning convention documented in `CLAUDE.md`: patch/minor/major for future bumps.

**Verified:** `GET https://stage-api.houseoffunk.net/health` → `{ "status": "ok", "version": "1.0.0" }`. Dashboard footer confirmed via Playwright.

---

### 6. Harden API deploy workflows

**Problem discovered:** `pm2 restart <name>` fails with "Process not found" if the process isn't registered in pm2's list (e.g. after a pm2 reset or on first deploy to a fresh server). The staging deploy was failing because `my-collections-api-stage` wasn't in pm2's process list.

**Fix:**
- Replaced `pm2 restart my-collections-api-stage` with `pm2 startOrReload ecosystem.config.js --only my-collections-api-stage && pm2 save` in `deploy-api-stage.yml` — starts if absent, gracefully reloads if running, and persists the list for reboots.
- Same change applied to `deploy-api.yml` for production.
- Added a `Health check` step after restart in both workflows: `sleep 5 && curl --fail --silent --max-time 10 https://<domain>/health`. Fails the deploy if the app crashes on boot, which `pm2 startOrReload` alone would silently swallow.

**Manual fix required on Mac Mini:** The stale pm2 entry had to be cleared first:
```bash
pm2 delete my-collections-api-stage || true
pm2 start ecosystem.config.js --only my-collections-api-stage
pm2 save
```

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


## Session 4 — 2026-05-14

### 1. Created auto-sync workflow (main → develop)

**Problem:** Every develop → main PR showed "This branch is out-of-date with the base branch" because GitHub merge commits on main aren't automatically reflected on develop. Required a manual merge or update before merging.

**Command:**
```bash
git checkout -b feature/sync-main-to-develop
# created .github/workflows/sync-main-to-develop.yml
git push -u origin feature/sync-main-to-develop
gh pr create --base develop ...  # PR #60
```

**What it does:** Workflow triggers on every push to `main`, checks out `develop`, fetches `origin/main`, merges it in (fast-forward), and pushes back. Commit message includes `[skip ci]` to avoid triggering the CI pipeline on the back-merge.

**Why:** Eliminates the recurring "out of date" banner on develop → main PRs without any manual intervention.

### 2. Fixed GITHUB_TOKEN permissions (403 on push)

**Problem:** First run of the sync workflow failed with:
```
remote: Permission to jasonfunk/my-collections.git denied to github-actions[bot].
fatal: unable to access '...': The requested URL returned error: 403
```
The merge itself succeeded (fast-forward), but the push was denied because `GITHUB_TOKEN` defaults to read-only for repository contents.

**Fix:** Added `permissions: contents: write` to the sync job in the workflow file (PR #61).

**Why `GITHUB_TOKEN` and not a PAT:** The built-in token is scoped to one repo and expires after the run — it can't be extracted for long-term misuse. PATs are long-lived and user-scoped, which is a larger blast radius. `contents: write` is the minimum permission needed.

**Verified:** After merging PR #61 to develop and develop to main, the sync workflow ran and successfully pushed a back-merge commit to develop automatically.

## Session 5 — 2026-05-14

### 1. Created backup infrastructure directories on Mini

**Command:**
```bash
mkdir -p ~/scripts ~/backups/db ~/logs
```

**What it does:** Creates the three directories the backup system needs — `~/scripts/` for the deployed script symlink, `~/backups/db/` for local dump files, and `~/logs/` for script output.

**Why:** Keeps backup artifacts out of the application directory and gives launchd predictable absolute paths to write logs to.

---

### 2. Generated Dreamhost SSH key on Mini

**Command:**
```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_dreamhost -N "" -C "mini-db-backup"
```

**What it does:** Creates a dedicated ed25519 keypair for the Mini → Dreamhost rsync connection. No passphrase so launchd can use it unattended.

**Why a dedicated key:** Keeps the Dreamhost credential independent from the Mini's primary SSH key. If it ever needs to be revoked (key compromise, Dreamhost account change), it can be removed from `authorized_keys` without affecting any other access.

**Public key added to:** `jfunkshell@ssh.houseoffunk.net:~/.ssh/authorized_keys` (via Dreamhost panel).

---

### 3. Pre-populated Dreamhost host key in known_hosts

**Command:**
```bash
ssh-keyscan -H ssh.houseoffunk.net >> ~/.ssh/known_hosts
```

**What it does:** Adds Dreamhost's server fingerprint to the Mini's `~/.ssh/known_hosts` non-interactively.

**Why:** Without this, the first `rsync` would block on "Are you sure you want to continue connecting (yes/no)?" — which launchd can't answer. `StrictHostKeyChecking=accept-new` in the script also covers future host-key changes, but pre-seeding is cleaner.

---

### 4. Created remote directory on Dreamhost

**Command (run from Mini):**
```bash
ssh -i ~/.ssh/id_ed25519_dreamhost jfunkshell@ssh.houseoffunk.net 'mkdir -p ~/backups/my-collections'
```

**What it does:** Creates the target directory for rsync on Dreamhost. rsync does not create the remote destination directory automatically.

**Why `ssh.houseoffunk.net`:** A Cloudflare-proxied CNAME pointing at Dreamhost's SSH server. Using a custom hostname means the script doesn't need updating if Dreamhost migrates the account to a different server.

---

### 5. Wrote and committed backup script and launchd plist

**Files committed:**
- `devops/scripts/backup-db.sh` — reads `DATABASE_URL` from each `.env` at runtime; pg_dump → gzip; prunes files older than 7 days; rsync to Dreamhost
- `devops/launchd/com.jfunk.db-backup.plist` — `StartCalendarInterval` at 02:00 daily; stdout/stderr captured to `~/logs/`

**Deployed on Mini:**
```bash
ln -sf ~/Sites/my-collections/devops/scripts/backup-db.sh ~/scripts/backup-db.sh
chmod +x ~/Sites/my-collections/devops/scripts/backup-db.sh
cp devops/launchd/com.jfunk.db-backup.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.jfunk.db-backup.plist
```

**Why symlink (not copy):** `git pull` on the Mini automatically picks up script changes without a separate deploy step.

**Why `StartCalendarInterval` (not `StartInterval`):** `StartInterval` fires N seconds after the job loads, not at a wall-clock time. `StartCalendarInterval` fires at a fixed time regardless of when launchd last started — correct for a daily backup.

---

### 6. Manual test run — full backup script

**Command:**
```bash
bash ~/scripts/backup-db.sh
```

**Result:** Both databases dumped successfully (64K each). rsync completed to `jfunkshell@ssh.houseoffunk.net:~/backups/my-collections/`. Log shows "Backup complete" at 15:51:29.

---

### 7. Restore test against scratch DB

**Commands:**
```bash
LATEST=$(ls -t ~/backups/db/my_collections_2*.sql.gz | head -1)
createdb my_collections_restore_test
gunzip -c "$LATEST" | psql my_collections_restore_test
psql my_collections_restore_test -c '\dt'
psql my_collections_restore_test -c 'SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;'
dropdb my_collections_restore_test
```

**Result:** All 11 tables restored. Row counts matched production: 443 TF / 127 HM / 199 SW catalog rows, 1 user, 2 OAuth clients. Scratch DB dropped cleanly.

**Why test the restore:** A backup that can't restore is worse than no backup — you have false confidence. This confirms the dump is a valid, loadable PostgreSQL archive.

---

## Session 6 — 2026-05-14

Operations hardening: COL-118 (pm2 log rotation), COL-116 (uptime monitoring), COL-129 (backup dead-man's-switch).

### 1. Install and configure pm2-logrotate (COL-118)

**Commands:**
```bash
ssh mini.houseoffunk.net "source ~/.zprofile && pm2 install pm2-logrotate"
ssh mini.houseoffunk.net "source ~/.zprofile && \
  pm2 set pm2-logrotate:max_size 50M && \
  pm2 set pm2-logrotate:retain 14 && \
  pm2 set pm2-logrotate:compress true && \
  pm2 save"
```

**What it does:** `pm2-logrotate` is a pm2 module that monitors `~/.pm2/logs/` and rotates log files when they exceed the configured size. It renames the current log file (appending a timestamp), compresses it with gzip, and starts a new empty file. `pm2 save` persists the module across reboots.

**Why:** pm2 writes application stdout/stderr to `~/.pm2/logs/` indefinitely. Without rotation these files grow without bound and will eventually fill the 512 GB SSD.

**Configuration:**
- `max_size 50M` — rotate when a single log file reaches 50 MB
- `retain 14` — keep 14 rotated files (~2 weeks of history per process)
- `compress true` — gzip old log files to save disk space
- `rotateInterval '0 0 * * *'` (default) — also force daily rotation at midnight regardless of size

---

### 2. Set up UptimeRobot uptime monitoring (COL-116)

**What was done:** Created UptimeRobot account (jfunk@houseoffunk.net, Google SSO — no separate password) and configured two HTTP monitors via the web UI:

| Monitor | URL | Interval | Alert |
|---|---|---|---|
| my-collections API (prod) | `https://api.houseoffunk.net/health` | 5 min | jfunk@houseoffunk.net |
| my-collections API (staging) | `https://stage-api.houseoffunk.net/health` | 5 min | jfunk@houseoffunk.net |

**What it does:** UptimeRobot polls each URL from external servers every 5 minutes. If a monitor receives a non-2xx response or times out, it sends an email alert. Catches outages that internal process monitoring cannot: network-level failures, cloudflared tunnel failures, power loss.

**Why external monitoring:** pm2 restart-on-exit and launchd restart policies can't detect cloudflared crashes or network failures. An external monitor sees what users see.

**Why UptimeRobot free tier:** 50 monitors, 5-minute intervals, email alerts — more than sufficient. Zero infrastructure to maintain.

---

### 3. Add Healthchecks.io dead-man's-switch to backup script (COL-129)

**What was done:**
- Created Healthchecks.io account (jfunk@houseoffunk.net, magic-link auth — no password)
- Created check "my-collections DB backup" (period: 24h, grace: 1h)
- Stored ping URL on the Mini: `echo "https://hc-ping.com/994b111e-9430-465b-aceb-fd8dcd719768" > ~/.config/healthchecks-backup-url && chmod 600`
- Added curl ping to end of `devops/scripts/backup-db.sh` — reads URL from local file, never committed

**Script change:**
```bash
HEALTHCHECK_URL_FILE="$HOME/.config/healthchecks-backup-url"
if [ -f "$HEALTHCHECK_URL_FILE" ]; then
  curl --silent --max-time 10 "$(cat "$HEALTHCHECK_URL_FILE")" || true
fi
```

**What it does:** A dead-man's-switch — the backup script must check in every 24 hours or an alert fires. The ping is only reached if every prior step succeeded (`set -euo pipefail` causes early exit on any failure). This is the inverse of uptime monitoring: it alerts when a scheduled success stops happening, not when something goes wrong in real time.

**Verified:** Ran backup script manually via SSH after deploying the updated script. Healthchecks.io dashboard confirmed "Last Ping: 7 seconds ago" immediately.

**Note on SSH hostname:** Correct SSH hostname for the Mini via Cloudflare Tunnel is `mini.houseoffunk.net` (not `mini` shortcut). The `mini` alias requires additional `~/.ssh/config` setup not currently in place.
