---
confluence_page_id: "6324226"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/6324226"
title: "My Collections — Infrastructure Overview"
last_updated: "2026-04-11"
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
Cloudflare Edge        api.yourdomain.com DNS → Cloudflare IPs (home IP never exposed)
    │  SSL terminated at Cloudflare (free, automatic, no certbot)
    │
    │  outbound persistent tunnel — zero open inbound ports on home router
    ▼
cloudflared daemon     Mac Mini  (launchd system daemon, starts before login)
    │
    ▼
localhost:3000         NestJS API  (pm2 process: my-collections-api)
    │
    ▼
localhost:5432         PostgreSQL 16  (Homebrew service: postgresql@16)


GitHub.com
    │
    │  GitHub Actions runner polls outbound — zero inbound ports
    ▼
actions-runner         Mac Mini  (launchd user agent)
    │  direct filesystem access
    ▼
~/Sites/my-collections/   git pull → npm build → pm2 restart
```

## Design Decisions

### Cloudflare Tunnel — Zero Open Inbound Ports

Rather than opening ports 80 and 443 on the home router (which exposes the home IP in DNS and attracts automated scanning), the Mac Mini runs the `cloudflared` daemon. This makes a persistent outbound connection to Cloudflare's edge. Incoming requests for `api.yourdomain.com` arrive at Cloudflare, travel through the tunnel, and reach `localhost:3000` on the Mac Mini. SSL is provided by Cloudflare automatically — no certbot, no Let's Encrypt renewal management, no nginx SSL configuration.

The DNS record for api.yourdomain.com resolves to Cloudflare's IP addresses, not the home IP. This provides DDoS mitigation and hides the home network's location from the public internet.

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

All required in `~/Sites/my-collections/packages/api/.env` on the Mac Mini. This file must never be committed to git.

| Variable | Value / How to Generate |
| --- | --- |
| `PORT` | 3000 |
| `DATABASE_URL` | postgresql://my_collections:\<password\>@localhost:5432/my_collections |
| `JWT_ACCESS_SECRET` | openssl rand -hex 64 — generate a unique value, never reuse across environments |
| `JWT_ACCESS_EXPIRES_IN` | 15m |
| `JWT_REFRESH_SECRET` | openssl rand -hex 64 — must be a different value from JWT_ACCESS_SECRET |
| `JWT_REFRESH_EXPIRES_IN` | 30d |
| `REGISTRATION_ENABLED` | false — lock registration after creating your account |
| `ALLOWED_ORIGIN` | https://yourdomain.com — the Dreamhost-hosted frontend URL |
