---
confluence_page_id: "15499266"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/15499266"
title: "My Collections — Security & Operations Hardening"
last_updated: "2026-05-05"
---

Six improvements identified during infrastructure planning. Not yet implemented. Ordered roughly by risk priority.

## 1. Database Backups

**Risk without it:** Permanent data loss from accidental deletion, a failed migration, or disk failure.

**Approach:**

- Daily `pg_dump` cron job on the Mac Mini — dumps to the external SSD for fast local restore
- Secondary copy offsite: Backblaze B2 ($6/TB/month) or Cloudflare R2 (free up to 10 GB) for disaster recovery
- Cover both `my_collections` (production) and `my_collections_stage` (staging) databases
- Document and test the restore procedure before considering it done

**Suggested retention policy:** 7 daily, 4 weekly, 12 monthly.

**Example cron entry (`crontab -e`):**

```shell
# Daily at 2am — dump production DB to external SSD
0 2 * * * pg_dump -U my_collections my_collections | gzip > /Volumes/ExternalSSD/backups/my_collections_$(date +\%Y-\%m-\%d).sql.gz

# Sync to offsite (requires rclone configured with B2 remote)
30 2 * * * rclone sync /Volumes/ExternalSSD/backups/ b2:my-collections-backups/
```

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

## 3. Uptime Monitoring

**Risk without it:** Server outages (power loss, cloudflared crash, pm2 failure) go undetected until you try to use the app.

**Approach:**

- Configure [UptimeRobot](https://uptimerobot.com) free tier — 5-minute polling interval, email alerts on failure
- Primary monitor: `GET https://api.houseoffunk.net/health/ready` → expected `{ "status": "ready", "db": "ok" }`
- Optional: `GET https://collections.houseoffunk.net` for the SPA
- Optional: `GET https://stage-api.houseoffunk.net/health/ready` for staging

No code changes required. Free plan supports up to 50 monitors.

---

## 4. Security Headers (Helmet)

**Risk without it:** Missing standard HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`). Flagged by any automated security scanner.

**Approach:**

- `npm install @nestjs/helmet` in `packages/api`
- Add `app.use(helmet())` to `packages/api/src/main.ts` before `app.listen()`
- One line change

**File:** `packages/api/src/main.ts`

---

## 5. pm2 Log Rotation

**Risk without it:** `~/.pm2/logs/*.log` grows unboundedly. Will eventually fill the 512 GB SSD.

**Approach:**

Run on the Mac Mini via SSH — no code changes to the application:

```shell
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD
```

Applies automatically to all pm2 processes (`my-collections-api` and `my-collections-api-stage`).

---

## 6. Refresh Token Rotation

**Risk without it:** A stolen refresh token can be used indefinitely without detection. With rotation, reuse of a stolen token causes an immediate collision — the real user's next request fails, signaling a possible breach.

**Approach:**

- On `POST /auth/token` (refresh grant): issue a new refresh token and immediately invalidate the one that was just used (update the `refresh_tokens` table row)
- On detected reuse (token already marked revoked): invalidate all refresh tokens for that user — assume compromise
- Review current implementation in `packages/api/src/modules/auth/` to determine if rotation is already in place or needs to be added

**Files:** `packages/api/src/modules/auth/auth.service.ts`, `packages/api/src/modules/auth/token.service.ts` (or equivalent)
