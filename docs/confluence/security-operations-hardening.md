---
confluence_page_id: "15499266"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/15499266"
title: "My Collections — Security & Operations Hardening"
last_updated: "2026-05-14"
---

Seven improvements identified during infrastructure planning. Items 1, 3, 5, and 6 are complete. Items 2, 4, and 7 remain open.

## 1. Database Backups ✅ Done (COL-114 + COL-129, 2026-05-14)

**Risk without it:** Permanent data loss from accidental deletion, a failed migration, or disk failure.

**Implemented:** Daily `pg_dump` via launchd on the Mac Mini at 02:00. Both `my_collections` (prod) and `my_collections_stage` (staging) are dumped, gzipped, pruned to 7-day local retention, and rsynced to Dreamhost shared hosting (`~/backups/my-collections/`). A Healthchecks.io dead-man's-switch pings on full success — see section 6.

**Script:** `devops/scripts/backup-db.sh` (symlinked to `~/scripts/backup-db.sh` on the Mini)  
**Scheduler:** `devops/launchd/com.jfunk.db-backup.plist` (installed to `~/Library/LaunchAgents/`)  
**Restore tested:** All 11 tables verified against a scratch DB; scratch dropped clean.

---

## 2. Rate Limiting on Auth Endpoints

**Risk without it:** `/auth/login` and `/auth/token` accept unlimited requests — brute-force attacks are unrestricted.

**Approach:**

- Install `@nestjs/throttler` in `packages/api`
- Register `ThrottlerModule` in `AppModule` with a global default
- Apply a tighter guard on auth routes specifically — 5 requests/minute/IP on `/auth/login`, 10 requests/minute/IP on `/auth/token`
- Returns `429 Too Many Requests` on breach

**Files:** `packages/api/src/app.module.ts`, auth controller

---

## 3. Uptime Monitoring ✅ Done (COL-116, 2026-05-14)

**Risk without it:** Server outages (power loss, cloudflared crash, pm2 failure) go undetected until you try to use the app.

**Implemented:** UptimeRobot free tier. Two HTTP monitors ping `/health` every 5 minutes from external servers. Email alert to jfunk@houseoffunk.net on any failure. Account uses Google SSO (jfunk@houseoffunk.net) — no separate password.

| Monitor | URL | Interval |
| --- | --- | --- |
| my-collections API (prod) | `https://api.houseoffunk.net/health` | 5 min |
| my-collections API (staging) | `https://stage-api.houseoffunk.net/health` | 5 min |

No code changes were required. See [Infrastructure Overview](infrastructure-overview.md) for account details.

---

## 4. Security Headers (Helmet)

**Risk without it:** Missing standard HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`). Flagged by any automated security scanner.

**Approach:**

- `npm install @nestjs/helmet` in `packages/api`
- Add `app.use(helmet())` to `packages/api/src/main.ts` before `app.listen()`
- One line change

**File:** `packages/api/src/main.ts`

---

## 5. pm2 Log Rotation ✅ Done (COL-118, 2026-05-14)

**Risk without it:** `~/.pm2/logs/*.log` grows unboundedly. Will eventually fill the 512 GB SSD.

**Implemented:** `pm2-logrotate` module installed globally on the Mac Mini. Configuration:

| Setting | Value | Reason |
| --- | --- | --- |
| `max_size` | 50M | Rotate when any log file hits 50 MB |
| `retain` | 14 | Keep ~2 weeks of rotated files per process |
| `compress` | true | Gzip rotated files to save disk |
| `rotateInterval` | `0 0 * * *` | Also force daily rotation at midnight regardless of size |

Applies automatically to all pm2 processes. No code changes to the application required.

---

## 6. Backup Job Monitoring ✅ Done (COL-129, 2026-05-14)

**Risk without it:** The daily backup script fails silently — disk full, rsync auth error, pg_dump failure — and nobody knows until it's time to restore and there's nothing there.

**Implemented:** [Healthchecks.io](https://healthchecks.io) dead-man's-switch. The backup script curls a unique ping URL at the very end — only reachable if every previous step succeeded (`set -euo pipefail` causes early exit on any failure). If Healthchecks.io receives no ping within 25 hours (24h period + 1h grace), it sends an email alert.

The ping UUID is stored in `~/.config/healthchecks-backup-url` on the Mac Mini only — it is never committed to git. The script reads it at runtime:

```bash
HEALTHCHECK_URL_FILE="$HOME/.config/healthchecks-backup-url"
if [ -f "$HEALTHCHECK_URL_FILE" ]; then
  curl --silent --max-time 10 "$(cat "$HEALTHCHECK_URL_FILE")" || true
fi
```

See `devops/scripts/backup-db.sh` and [Infrastructure Overview](infrastructure-overview.md) for account details and the check UUID.

---

## 7. Refresh Token Rotation

**Risk without it:** A stolen refresh token can be used indefinitely without detection. With rotation, reuse of a stolen token causes an immediate collision — the real user's next request fails, signaling a possible breach.

**Approach:**

- On `POST /auth/token` (refresh grant): issue a new refresh token and immediately invalidate the one that was just used (update the `refresh_tokens` table row)
- On detected reuse (token already marked revoked): invalidate all refresh tokens for that user — assume compromise
- Review current implementation in `packages/api/src/modules/auth/` to determine if rotation is already in place or needs to be added

**Files:** `packages/api/src/modules/auth/auth.service.ts`, `packages/api/src/modules/auth/token.service.ts` (or equivalent)
