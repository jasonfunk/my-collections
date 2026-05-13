# CLAUDE.md — Mac Mini Self-Hosted DevOps Context

This file provides guidance to Claude Code when working on the my-collections Mac Mini server.
Load this at the start of every session to orient yourself before taking any action.

## Server Purpose

This Mac Mini hosts the **my-collections API** — a NestJS/Node.js REST API backed by PostgreSQL.

- **API:** NestJS application, runs on port 3000, managed by pm2
- **Database:** PostgreSQL 16, local to this machine (installed via Homebrew)
- **Tunnel:** Cloudflare Tunnel (`cloudflared`) routes public traffic to localhost:3000 — no open inbound ports
- **Web frontend:** Served separately from Dreamhost shared hosting (static React SPA build)
- **Source of truth:** GitHub repo `my-collections`, branch `main`
- **CI/CD:** GitHub Actions self-hosted runner installed on this machine — polls GitHub, no inbound ports needed

The Mac Mini runs headlessly. All access is via SSH (local network or Cloudflare Tunnel) or Screen Sharing.

---

## Collaboration Approach

### Expert + Mentor Role

Act as a senior macOS systems administrator and DevOps engineer — and also as a mentor.
The user is an experienced developer who is new to server operations. For every action:

- **Explain before executing.** State what a command does and why it's necessary before running it.
- **Teach the concept.** Draw analogies to familiar programming concepts when helpful
  (e.g., launchd is macOS's service manager — think of it like systemd on Linux, or Windows Services,
  but configured with XML plist files instead of unit files).
- **Call out macOS vs Linux differences proactively.** Most DevOps documentation assumes Linux.
  When something works differently on macOS — paths, service management, package manager, firewall —
  say so explicitly rather than assuming prior knowledge.
- **Flag trade-offs.** If there are multiple valid approaches, briefly explain why this one was chosen.
- **Surface gotchas.** Warn about common macOS-specific pitfalls before they happen.

### Key macOS vs Linux Differences to Keep in Mind

| Concept | Linux | macOS |
|---|---|---|
| Package manager | `apt` / `yum` | Homebrew (`brew`) |
| Service manager | systemd (`systemctl`) | launchd (`launchctl`, `brew services`) |
| Service config files | `/etc/systemd/system/*.service` | `~/Library/LaunchAgents/*.plist` or `/Library/LaunchDaemons/*.plist` |
| Default shell | bash | zsh |
| Homebrew prefix (Apple Silicon) | n/a | `/opt/homebrew/` |
| Firewall | UFW / iptables | macOS Application Firewall (System Settings) |
| Root equivalent | `sudo` + root user | `sudo` (root login disabled by default) |

### Logging Convention

After every session, append a new entry to `devops/setup-log.md` in the project repo.
Follow the same format as `docs/setup-log.md`:

- Session header: `## Session N — YYYY-MM-DD`
- Numbered actions with a short title: `### 1. Title`
- For each action, include:
  - **Command:** the exact command(s) run
  - **What it does:** plain-language explanation
  - **Why:** the reasoning behind the choice
- Use fenced code blocks with language tags for all commands and config

This log is the permanent record of how this machine was configured. Future sessions — and future
Claude instances — will read it to understand the current state without re-examining the machine.

---

## Server Inventory

**Check this at the start of every session.** Update checkboxes as steps are completed.
This is the canonical record of what is installed and configured on this machine.

### System (configure with monitor attached before going headless)
- [x] macOS fully updated (System Settings → General → Software Update)
- [x] Hostname set (System Settings → General → Sharing → Local Hostname)
- [x] Remote Login (SSH) enabled (System Settings → General → Sharing → Remote Login)
- [x] Screen Sharing (VNC) enabled (System Settings → General → Sharing → Screen Sharing)
- [x] Energy Saver: "Prevent automatic sleeping" enabled (System Settings → Energy)
- [x] Energy Saver: "Wake for network access" enabled
- [x] Energy Saver: "Start up automatically after a power failure" enabled
- [x] Auto-login configured for the server user (System Settings → Users & Groups → Login Options)
- [x] FileVault: confirmed OFF (FileVault blocks auto-login after power loss — leave disabled)
- [ ] macOS Firewall enabled (System Settings → Network → Firewall)
- [x] macOS software updates set to "Download new updates when available" but NOT auto-install
- [x] Dummy HDMI plug connected (prevents GPU/display weirdness in headless mode)
- [x] Homebrew installed (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`)
- [x] Homebrew added to PATH in `~/.zprofile`

### SSH Hardening (after confirming SSH works)
- [x] SSH key-based auth confirmed working from another machine
- [x] SSH password auth disabled (`PasswordAuthentication no` in `/etc/ssh/sshd_config`)
- [x] SSH config reloaded (`sudo launchctl unload /System/Library/LaunchDaemons/ssh.plist && sudo launchctl load /System/Library/LaunchDaemons/ssh.plist`)

### Node.js
- [ ] nvm installed (`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`)
- [ ] nvm added to `~/.zprofile` (nvm installer does this, verify it's present)
- [ ] Node.js v20 LTS installed (`nvm install 20 && nvm alias default 20`)
- [ ] Version confirmed (`node -v` → v20.x.x)

### PostgreSQL
- [ ] PostgreSQL 16 installed (`brew install postgresql@16`)
- [ ] PostgreSQL added to PATH (`echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zprofile`)
- [ ] PostgreSQL started as a Homebrew service (`brew services start postgresql@16`)
- [ ] PostgreSQL set to start on login (Homebrew services handles this automatically)
- [ ] Database `my_collections` created
- [ ] User `my_collections` created (with strong generated password)
- [ ] User granted all privileges on the database
- [ ] Local connection verified (`psql` test as app user)

### Application
- [ ] Repo cloned to `~/Sites/my-collections`
- [ ] `npm ci` run (production dependencies installed)
- [ ] `~/Sites/my-collections/packages/api/.env` created with production secrets
- [ ] Build succeeded (`npm run build` from repo root)
- [ ] TypeORM migrations run and confirmed
- [ ] OAuth clients seeded with production redirect URIs

### pm2
- [ ] pm2 installed globally (`npm install -g pm2`)
- [ ] `ecosystem.config.js` created at `~/Sites/my-collections/`
- [ ] Application started via pm2 (`pm2 start ecosystem.config.js`)
- [ ] pm2 launchd startup configured (`pm2 startup` → copies and runs the output command)
- [ ] `pm2 save` run (saves process list so it restores after reboot)
- [ ] Reboot tested: confirmed API comes back up without manual intervention

### Cloudflare Tunnel
- [x] Cloudflare account created (free tier)
- [x] Domain added to Cloudflare OR Dreamhost DNS CNAME configured (see DNS Options below)
- [x] cloudflared installed (`brew install cloudflare/cloudflare/cloudflared`)
- [x] cloudflared authenticated to Cloudflare account (`cloudflared tunnel login`)
- [x] Tunnel created (`cloudflared tunnel create my-collections`)
- [x] Tunnel config file created at `~/.cloudflared/config.yml`
- [x] DNS route configured (`cloudflared tunnel route dns my-collections api.yourdomain.com`)
- [x] Tunnel tested manually (`cloudflared tunnel run my-collections`)
- [x] cloudflared installed as a launchd service (`sudo cloudflared service install`)
- [x] Service confirmed running (`sudo launchctl list | grep cloudflared`)
- [ ] API reachable at `https://api.houseoffunk.net` — pending application install (Step 5)

### Cloudflare Tunnel — SSH Access (optional but recommended for remote access)
- [x] Second tunnel route configured for SSH (`cloudflared tunnel route dns my-collections mini.houseoffunk.net`)
- [x] SSH ingress rule added to `~/.cloudflared/config.yml`
- [x] cloudflared installed on **client machine** too (needed to use `cloudflared access ssh`)
- [x] Remote SSH confirmed: `ssh mini.houseoffunk.net` (via Cloudflare Access OTP)

### GitHub Actions Self-Hosted Runner
- [x] Runner downloaded from GitHub (repo → Settings → Actions → Runners → New self-hosted runner → macOS)
- [x] Runner installed at `~/actions-runner/`
- [x] Runner configured with repo URL and registration token
- [x] Runner installed as a launchd service (`./svc.sh install && ./svc.sh start` — no sudo; LaunchAgent)
- [x] Runner visible as **Online** in GitHub → Settings → Actions → Runners

---

## Architecture

```
Internet
    │
    ▼
Cloudflare Edge   (api.yourdomain.com DNS → Cloudflare)
    │  SSL terminated at Cloudflare (free, automatic)
    │  Home IP never exposed in DNS
    │
    │  (outbound persistent tunnel — no open inbound ports)
    ▼
cloudflared daemon   Mac Mini  (launchd service)
    │
    ▼
localhost:3000        NestJS API  (pm2 process: my-collections-api)
    │
    ▼
localhost:5432        PostgreSQL 16  (Homebrew service: postgresql@16)


GitHub.com
    │
    │  (GitHub Actions runner polls outbound — no inbound ports)
    ▼
actions-runner        Mac Mini  (launchd service: ~/actions-runner/)
    │
    ▼
~/Sites/my-collections/    (direct filesystem access — git pull, npm build, pm2 restart)
```

**Key paths on the machine:**

| Path | Purpose |
|---|---|
| `~/Sites/my-collections/` | Application root (git clone) |
| `~/Sites/my-collections/packages/api/` | NestJS package |
| `~/Sites/my-collections/packages/api/dist/` | Compiled build output |
| `~/Sites/my-collections/packages/api/.env` | Production secrets (never committed) |
| `~/Sites/my-collections/ecosystem.config.js` | pm2 process definition |
| `~/.cloudflared/config.yml` | Cloudflare Tunnel configuration |
| `~/actions-runner/` | GitHub Actions self-hosted runner |
| `~/.pm2/logs/` | pm2 application logs |
| `/opt/homebrew/` | Homebrew prefix (Apple Silicon) |

**pm2 process name:** `my-collections-api`

---

## DNS Options

Two ways to connect `api.yourdomain.com` to your Cloudflare Tunnel:

### Option A: Move domain DNS to Cloudflare (recommended)
Change your domain's nameservers (at your registrar) to Cloudflare's.
Cloudflare then manages all DNS records and provides the orange-cloud proxy protection.
`cloudflared tunnel route dns` adds the CNAME automatically.

### Option B: Keep Dreamhost DNS, add CNAME manually
In Dreamhost DNS panel, add:
- **Name:** `api`
- **Type:** `CNAME`
- **Value:** `<tunnel-id>.cfargotunnel.com`

You lose some Cloudflare proxy benefits but the tunnel still works. Simpler if you don't want
to migrate DNS management.

---

## Environment Variables

All required variables for `~/Sites/my-collections/packages/api/.env`.
This file must never be committed to git. Create it manually on the machine.

| Variable | Value / How to generate |
|---|---|
| `PORT` | `3000` |
| `NODE_ENV` | `production` — disables Swagger docs; enables prod-format JSON logging |
| `DATABASE_URL` | `postgresql://my_collections:<password>@localhost:5432/my_collections` |
| `JWT_ACCESS_SECRET` | `openssl rand -hex 64` — generate a new value, never reuse |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 64` — **different** from access secret |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `COOKIE_SECRET` | `openssl rand -hex 32` — signs the httpOnly refresh-token cookie |
| `REGISTRATION_ENABLED` | `true` during initial setup; set `false` after creating your account |
| `ALLOWED_ORIGINS` | `https://collections.houseoffunk.net` — comma-separated list of allowed frontend origins |

**Why two JWT secrets?** If an attacker obtains one, they cannot forge tokens signed by the other.
Two independent secrets = two independent blast radiuses.

**Why `REGISTRATION_ENABLED=false`?** This is a personal app. Create your account once during
setup, then lock registration so no one else can sign up.

---

## Pre-Production Code Changes

> **Status: DONE.** All changes below are committed to `main`. Verify before cloning if
> returning to this section from a future session.

These changes must be made in the **source repo** and committed to `main` before running
seeds or doing a production deploy.

### 1. CORS — restrict to your frontend origin

`packages/api/src/main.ts` currently uses `app.enableCors()` with no origin restriction.
In production, restrict it:

```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true,
});
```

Add `ALLOWED_ORIGIN=https://yourdomain.com` to the machine's `.env`.

### 2. OAuth redirect URIs — update seed data

`packages/api/src/database/seeds/oauth-clients.seed.ts` has a placeholder production URI:
`https://mycollections.example.com/auth/callback`

Update it to your actual Dreamhost frontend URL before running seeds on the production DB.
The PKCE flow will reject redirect URIs that don't exactly match what's in the database.

---

## Headless Operation

The Mac Mini runs without a monitor. All access is through one of these methods:

### Local network SSH (fastest, always available on LAN)
```bash
ssh username@mini.local           # Bonjour hostname (works on local network only)
ssh username@<local-ip>           # Direct IP if Bonjour isn't resolving
```

### Remote SSH via Cloudflare Tunnel (access from anywhere, no open ports)
Requires `cloudflared` installed on your client machine too.
```bash
cloudflared access ssh --hostname ssh.yourdomain.com
# Then in a separate terminal:
ssh -o ProxyCommand='cloudflared access ssh --hostname %h' ssh.yourdomain.com
```
Or add this to your local `~/.ssh/config` for convenience:
```
Host mini
  HostName ssh.yourdomain.com
  ProxyCommand cloudflared access ssh --hostname %h
  User username
```
Then: `ssh mini`

### Screen Sharing (GUI access when needed)
From another Mac on the same network: Finder → Go → Connect to Server → `vnc://mini.local`
From anywhere: use a VNC client pointed at the Cloudflare Tunnel SSH tunnel with port forwarding,
or enable Tailscale for a simpler always-on LAN-like experience.

### Tailscale (optional — simpler remote access alternative)
Tailscale creates a zero-config VPN mesh between your devices. Install on the Mac Mini and
your other devices, and `ssh mini` works from anywhere without Cloudflare Tunnel SSH setup.
Free tier covers personal use. Consider adding if Cloudflare SSH feels complex.

---

## Common Commands

```bash
# --- Application status ---
pm2 status                                     # All processes + uptime + memory
pm2 logs my-collections-api                   # Tail application logs (Ctrl+C to exit)
pm2 logs my-collections-api --lines 200       # Last 200 lines
pm2 restart my-collections-api               # Restart the API process

# --- Manual deploy (the GitHub Actions runner does this automatically) ---
cd ~/Sites/my-collections
git pull origin main
npm ci
npm run build -- --filter=@my-collections/api   # mobile build requires react-native-web (not installed on server)
pm2 restart my-collections-api

# --- Database ---
psql $DATABASE_URL                                          # Connect as the app user
cd ~/Sites/my-collections/packages/api && npm run migration:run    # Run pending migrations (must cd to packages/api)
cd ~/Sites/my-collections/packages/api && npm run migration:show   # List migration status

# --- Seeds (run from repo root) ---
cd ~/Sites/my-collections
npm run seed:star-wars       # catalog seeds use absolute __dirname path — CWD doesn't matter
npm run seed:transformers
npm run seed:he-man
# OAuth clients seed: CWD matters (uses plain dotenv.config())
cd ~/Sites/my-collections/packages/api && npx ts-node --project tsconfig.json src/database/seeds/oauth-clients.seed.ts

# --- Homebrew services (PostgreSQL, cloudflared) ---
brew services list                             # All managed services + status
brew services start postgresql@16             # Start PostgreSQL
brew services stop postgresql@16              # Stop PostgreSQL
brew services restart postgresql@16          # Restart PostgreSQL

# --- Cloudflare Tunnel ---
sudo launchctl list | grep cloudflared        # Check tunnel service status
cloudflared tunnel list                        # List tunnels + last seen
cloudflared tunnel info my-collections        # Tunnel details

# --- GitHub Actions runner ---
launchctl list | grep actions                 # Check runner service status (no sudo — LaunchAgent)
# Logs: ~/actions-runner/_diag/

# --- launchd (macOS service manager) ---
# LaunchAgents run as the current user; LaunchDaemons run as root
# pm2 and the GitHub runner use LaunchAgents (user-space)
# cloudflared uses LaunchDaemons (system-space, starts before login)
launchctl list                                 # All user-space services
sudo launchctl list                            # All system-space services
```

---

## Known Gotchas (lessons from Session 1 — 2026-05-13)

### pm2 `cwd` must be `packages/api/`, not repo root
`ConfigModule.forRoot({ isGlobal: true })` in NestJS reads `.env` from the process CWD.
The `.env` lives at `packages/api/.env`. If pm2 runs with `cwd` pointing at the repo root,
NestJS silently starts without any env vars — no error, just immediate crash-restart loop.
`ecosystem.config.js` is committed to the repo with `cwd: \`${__dirname}/packages/api\``.

### Build filter required on server: `--filter=@my-collections/api`
`npm run build` without a filter also tries to build `@my-collections/mobile`, which runs
`expo export`. The server doesn't have `react-native-web` installed, so the mobile build fails
and Turborepo marks the whole pipeline as failed. Always use the filter.

### `ts-node` is not globally installed — use `npx ts-node`
`ts-node` is a workspace devDependency, not a global. `ts-node ...` gives `command not found`.
Use `npx ts-node --project packages/api/tsconfig.json <seed-path>`.

### oauth-clients seed CWD matters
`oauth-clients.seed.ts` calls `dotenv.config()` with no path — reads `.env` from CWD.
Must run from `packages/api/`. The catalog seeds (`run-star-wars-seed.ts`, etc.) use
`dotenv.config({ path: path.resolve(__dirname, '../../../.env') })` — they work from anywhere.

### SSH commands need `source ~/.zprofile`
Non-interactive SSH sessions don't source `~/.zprofile`. Both nvm (Node/npm) and the
PostgreSQL 16 bin path are set there. Any command that needs `node`, `npm`, `psql`, or
`brew services` must prefix with `source ~/.zprofile &&` or the command will not be found.

### New users are created with `isApproved: false`
Migration `UserIsApprovedDefaultFalse` changed the DB default. After registering any account,
approve it manually: `psql $DATABASE_URL -c "UPDATE users SET \"isApproved\" = true WHERE email = '...';"`.

### Web frontend: raw `fetch` calls in `AuthContext.tsx` bypass `API_ORIGIN`
`apiClient` in `client.ts` correctly prefixes `VITE_API_BASE_URL`. But `AuthContext.tsx`
made direct `fetch('/api/...')` calls that resolved relative to the frontend origin in
production. Fixed in PR #39 (2026-05-13) — all auth fetches now use `${API_ORIGIN}/api/...`.
If you see login failing against a deployed API, check for hardcoded `/api/` paths.

---

## Session Close Checklist

Before ending a session:

1. **Update Server Inventory** — check off completed steps in this file
2. **Append to `devops/setup-log.md`** — session date, actions taken, commands run, decisions made
3. **Commit any source-repo changes** — CORS config, OAuth URIs, ecosystem.config.js, etc.
4. **Verify headless state** — if you touched SSH or network settings, confirm you can still
   reconnect before closing the terminal session
