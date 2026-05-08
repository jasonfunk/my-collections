---
confluence_page_id: "6324226"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/6324226"
title: "My Collections — Infrastructure Overview"
last_updated: "2026-05-05"
---

The my-collections API is self-hosted on a Mac Mini M4 at home, exposed to the public internet via Cloudflare Tunnel (free tier). There are no open inbound ports on the home router — all public traffic flows through Cloudflare's edge network. CI/CD deploys via a GitHub Actions self-hosted runner installed on the Mac Mini, which polls GitHub over an outbound connection. After initial setup with a monitor attached, the Mac Mini runs permanently in headless mode.

## Recommended Hardware

| Component | Selection | Notes |
| --- | --- | --- |
| **Model** | Mac Mini M4 (base) | $599 — 10-core CPU/GPU. More than sufficient for this API plus several additional services running concurrently. |
| **RAM** | 16 GB unified memory (base) | Sufficient for the API, PostgreSQL, and multiple Homebrew services. Upgrade to M4 Pro (24 GB) only if running large local LLMs (30B+ parameters via Ollama). |
| **Internal Storage** | 512 GB SSD | 256 GB fills quickly once photo storage (Immich) or media is added. 512 GB is the comfortable baseline. |
| **External Storage** | 1–2 TB USB-C SSD | For Immich photo library, media files, and Time Machine backups. Keep application code on the internal SSD. |
| **Accessories** | HDMI dummy plug, UPS | Dummy plug ($8–15) prevents GPU and display issues in headless mode. A UPS handles short power outages and enables graceful shutdown on longer ones. |

The M4 Mac Mini draws approximately 6–10 W at idle and 30–40 W under load. Running 24/7 costs roughly $10–20/year in electricity — far less than any comparably powered VPS, with significantly more compute.

## Architecture

```plaintext
Internet
    │
    ▼
Cloudflare Edge
    │  api.houseoffunk.net / stage-api.houseoffunk.net DNS → Cloudflare IPs (home IP never exposed)
    │  SSL terminated at Cloudflare (free, automatic, no certbot)
    │
    │  outbound persistent tunnel — zero open inbound ports on home router
    ▼
cloudflared daemon     Mac Mini  (launchd system daemon, starts before login)
    │
    ├──▶ localhost:3000    NestJS API  (pm2: my-collections-api)       ← api.houseoffunk.net
    │         │
    │         └──▶ my_collections db
    │
    └──▶ localhost:3001    NestJS API  (pm2: my-collections-api-stage) ← stage-api.houseoffunk.net
              │
              └──▶ my_collections_stage db

Both pm2 processes share: localhost:5432  PostgreSQL 16  (Homebrew: postgresql@16)


Dreamhost shared hosting
    ├── ~/collections.houseoffunk.net/   React SPA (production)  ← collections.houseoffunk.net
    └── ~/stage.houseoffunk.net/         React SPA (staging)     ← stage.houseoffunk.net


GitHub.com
    │
    │  GitHub Actions runner polls outbound — zero inbound ports
    ▼
actions-runner         Mac Mini  (launchd user agent)
    │  direct filesystem access
    ├──▶ ~/Sites/my-collections/        main branch  → pm2 restart my-collections-api
    └──▶ ~/Sites/my-collections-stage/  develop branch → pm2 restart my-collections-api-stage
```

## Design Decisions

### Cloudflare Tunnel — Zero Open Inbound Ports

Rather than opening ports 80 and 443 on the home router (which exposes the home IP in DNS and attracts automated scanning), the Mac Mini runs the `cloudflared` daemon. This makes a persistent outbound connection to Cloudflare's edge. Incoming requests for `api.houseoffunk.net` arrive at Cloudflare, travel through the tunnel, and reach `localhost:3000` on the Mac Mini. SSL is provided by Cloudflare automatically — no certbot, no Let's Encrypt renewal management, no nginx SSL configuration.

The DNS record for api.houseoffunk.net resolves to Cloudflare's IP addresses, not the home IP. This provides DDoS mitigation and hides the home network's location from the public internet.

### TLS and Encryption

Every leg of the request path is encrypted:

| Leg | Protocol | Notes |
| --- | --- | --- |
| User → Cloudflare edge | TLS (HTTPS) | Cloudflare's edge certificate. Automatic, no configuration required. |
| Cloudflare edge → cloudflared | TLS (QUIC or H2) | Inherent to the Cloudflare Tunnel protocol — `cloudflared` connects to `*.argotunnel.com` over TLS. Not configurable; always on. |
| cloudflared → localhost:3000 | HTTP (loopback) | Intentional. This hop never leaves the Mac Mini — it is loopback-only. Adding TLS here would encrypt memory-to-memory traffic on the same process boundary, providing no meaningful security improvement. |

The result is that no user data traverses any network segment unencrypted. The loopback HTTP hop is an internal implementation detail of the tunnel, not a network exposure.

If a future requirement calls for TLS on the final hop (e.g., compliance mandates no plaintext anywhere, even in process), the right approach is a [Cloudflare Origin CA certificate](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/) — free, 15-year validity, trusted by `cloudflared` without any `noTLSVerify` flags.

### GitHub Actions Self-Hosted Runner

Instead of GitHub Actions SSHing into the Mac Mini to deploy (which would require an open port or additional tunnel), a self-hosted runner is installed on the Mac Mini. It polls GitHub over outbound HTTPS, picks up queued jobs, executes them with direct filesystem access, and reports results back. No `VPS_HOST`, `VPS_USER`, or `VPS_SSH_KEY` secrets are needed for deployment.

Deploy jobs in GitHub Actions workflow files must use `runs-on: self-hosted` to target this runner instead of `runs-on: ubuntu-latest`.

### Headless macOS Operation

The Mac Mini runs without a monitor after initial setup. Key macOS settings for reliable headless operation: Energy Saver (never sleep, restart after power failure, wake on network access), auto-login for the server user so launchd services restart automatically after a reboot, and a dummy HDMI plug to prevent GPU and display-related issues when no physical display is connected.

FileVault must remain OFF. FileVault encrypts the disk and requires a password before the OS finishes booting, which prevents auto-login. Without auto-login, a power-loss reboot leaves the Mac Mini with no running services until someone physically intervenes.

## DNS Configuration Options

The Cloudflare Tunnel CNAME can be wired up in two ways. Option A is recommended for full Cloudflare proxy benefits.

| Option | How | Trade-offs |
| --- | --- | --- |
| **A — Move DNS to Cloudflare** | Change nameservers at domain registrar to Cloudflare's. Cloudflare manages all DNS records. | Full orange-cloud proxy protection. cloudflared tunnel route dns creates CNAMEs automatically. Requires DNS migration. |
| **B — CNAME at Dreamhost** | Keep Dreamhost DNS. Add CNAME manually: api → `<tunnel-id>.cfargotunnel.com` | No DNS migration required. Reduced Cloudflare proxy benefits. CNAME must be added manually per subdomain. |

## Environment Variables

Each environment has its own `.env` file on the Mac Mini. Neither file is ever committed to git.

**Production** — `~/Sites/my-collections/packages/api/.env`

| Variable | Value / How to Generate |
| --- | --- |
| `PORT` | 3000 |
| `DATABASE_URL` | postgresql://my_collections:\<password\>@localhost:5432/my_collections |
| `JWT_ACCESS_SECRET` | openssl rand -hex 64 — generate a unique value, never reuse across environments |
| `JWT_ACCESS_EXPIRES_IN` | 15m |
| `JWT_REFRESH_SECRET` | openssl rand -hex 64 — must be a different value from JWT_ACCESS_SECRET |
| `JWT_REFRESH_EXPIRES_IN` | 30d |
| `REGISTRATION_ENABLED` | false — lock registration after creating your account |
| `ALLOWED_ORIGIN` | https://collections.houseoffunk.net |

**Staging** — `~/Sites/my-collections-stage/packages/api/.env`

| Variable | Value / How to Generate |
| --- | --- |
| `PORT` | 3001 |
| `DATABASE_URL` | postgresql://my_collections:\<password\>@localhost:5432/my_collections_stage |
| `JWT_ACCESS_SECRET` | openssl rand -hex 64 — different value from production |
| `JWT_ACCESS_EXPIRES_IN` | 15m |
| `JWT_REFRESH_SECRET` | openssl rand -hex 64 — different from staging JWT_ACCESS_SECRET |
| `JWT_REFRESH_EXPIRES_IN` | 30d |
| `REGISTRATION_ENABLED` | true — staging can allow test accounts |
| `ALLOWED_ORIGIN` | https://stage.houseoffunk.net |
