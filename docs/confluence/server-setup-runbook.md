---
confluence_page_id: "6356993"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/6356993"
title: "My Collections — Server Setup Runbook"
last_updated: "2026-04-11"
---

This runbook has two phases. **Steps 1–3** require a monitor, keyboard, and mouse physically connected to the Mac Mini. **Steps 4–7** are done remotely over SSH after the monitor is unplugged.

## Step 1 — Pre-flight: Source Repo Changes

Make these changes in the local development environment before touching the Mac Mini. Commit to `main` before any production deploy.

### 1a. Update OAuth Redirect URIs

Open `packages/api/src/database/seeds/oauth-clients.seed.ts` and replace the placeholder production URI with the actual Dreamhost frontend domain:

```plaintext
Find:    https://mycollections.example.com/auth/callback
Replace: https://collections.yourdomain.com/auth/callback
```

The OAuth PKCE flow does an exact string match between the `redirect_uri` the client sends and what is registered in the database. A mismatch causes authorization to fail with a cryptic error. Fix this before running seeds on the production database.

### 1b. Restrict CORS to Frontend Origin

Open `packages/api/src/main.ts` and update the CORS setup. The current wide-open configuration allows any website to make authenticated requests from a user's browser.

```typescript
// Replace:
app.enableCors();

// With:
app.enableCors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true,
});
```

Add `ALLOWED_ORIGIN=https://collections.yourdomain.com` to `packages/api/.env.example`.

### 1c. Commit and Merge

```shell
git add packages/api/src/database/seeds/oauth-clients.seed.ts
git add packages/api/src/main.ts
git add packages/api/.env.example
git commit -m "fix: restrict CORS and update production OAuth redirect URIs"
git push origin develop
# Open a PR and merge to main
```

## Step 2 — Initial Mac Mini Setup (Monitor Attached)

Do all of Step 2 while the Mac Mini is connected to a monitor, keyboard, and mouse. This is the only time physical access is needed.

### First Boot and macOS Setup

Complete the macOS setup assistant. Create the server user account, connect to Ethernet (preferred over Wi-Fi for a server), and skip non-essential steps. Configure the router to assign a static local IP to the Mac Mini via DHCP reservation using its MAC address.

### Energy and Power Settings

Open **System Settings → Energy** and configure:

- Prevent automatic sleeping when the display is off → **ON**
- Wake for network access → **ON**
- Start up automatically after a power failure → **ON**

### Auto-Login

Open **System Settings → Users & Groups**, click the server user, and enable **Automatically log in as [user]**. This is required so launchd services (pm2, cloudflared, GitHub runner) start automatically after a reboot without physical intervention.

FileVault must be OFF for auto-login to work. FileVault encrypts the disk and requires a password before the OS finishes booting — it physically cannot auto-login. Go to **System Settings → Privacy & Security → FileVault** and confirm it is turned off.

### Software Update Policy

Open **System Settings → General → Software Update → Automatic Updates (i)** and configure:

- Download new updates when available → ON (awareness is fine)
- Install macOS updates → **OFF** (automatic OS updates can trigger unexpected reboots)
- Install application updates from the App Store → **OFF**
- Install Security Responses and system files → ON (low-risk security patches are fine)

### Remote Access (SSH and Screen Sharing)

Open **System Settings → General → Sharing** and enable:

- Remote Login (SSH) → ON
- Screen Sharing (VNC) → ON — allows GUI access from another Mac via Finder → Connect to Server → vnc://mini.local

Set a memorable hostname: **System Settings → General → Sharing → Local Hostname** → change to something short like `mini`. This makes SSH cleaner: `ssh username@mini.local`.

### Install Homebrew

Open Terminal and run the Homebrew installer:

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the prompts. At the end the installer prints commands to add Homebrew to PATH — run those commands, then verify:

```shell
source ~/.zprofile
brew --version
```

### Connect the Dummy HDMI Plug

Before unplugging the real monitor, plug a dummy HDMI plug into the Mac Mini's HDMI port. These cost $8–15 (search "HDMI dummy plug" or "HDMI headless ghost display emulator") and tell macOS that a display is connected, preventing GPU acceleration from being disabled and other display-dependent weirdness in headless mode.

## Step 3 — Verify SSH and Go Headless

Still with the monitor connected, test SSH from another machine on the local network:

```shell
ssh username@mini.local
# or by local IP:
ssh username@192.168.x.x
```

Once SSH is confirmed working, unplug the monitor (the dummy HDMI plug stays in), then the keyboard and mouse. The Mac Mini is now headless. Verify from the other machine:

```shell
ssh username@mini.local
hostname    # Mac Mini hostname
uptime      # Should show running time
```

All remaining steps are done via SSH.

## Step 4 — Set Up Cloudflare Tunnel

The Cloudflare Tunnel routes public traffic to the Mac Mini without opening any ports on the home router. SSL is handled by Cloudflare automatically.

### 4a. Create a Cloudflare Account

Sign up at cloudflare.com (free). Then add the domain — either transfer DNS management to Cloudflare (recommended, see Infrastructure Overview for the trade-offs) or keep Dreamhost DNS and add a CNAME manually after creating the tunnel.

### 4b. Install and Authenticate cloudflared

```shell
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel login
```

The login command prints a URL. Open it in a browser, select the domain, and authorize. This writes a certificate to `~/.cloudflared/cert.pem`.

### 4c. Create the Tunnel

```shell
cloudflared tunnel create my-collections
```

Note the tunnel ID printed in the output — it is needed for the config file and DNS setup.

### 4d. Create the Config File

```shell
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: <tunnel-id>
credentials-file: /Users/<username>/.cloudflared/<tunnel-id>.json

ingress:
  # Optional: expose SSH through Cloudflare (add before the 404 catch-all)
  # - hostname: ssh.yourdomain.com
  #   service: ssh://localhost:22
  - hostname: api.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

The final `http_status:404` catch-all rule is required by cloudflared — it handles any request that does not match a hostname rule. Omitting it causes the tunnel to fail to start.

### 4e. Configure DNS

If using Cloudflare-managed DNS (Option A from the Infrastructure Overview):

```shell
cloudflared tunnel route dns my-collections api.yourdomain.com
# If exposing SSH:
cloudflared tunnel route dns my-collections ssh.yourdomain.com
```

If keeping Dreamhost DNS (Option B): add a CNAME record in the Dreamhost panel manually — Name: `api`, Type: `CNAME`, Value: `<tunnel-id>.cfargotunnel.com`.

### 4f. Test Manually

```shell
# Start the tunnel manually to test (Ctrl+C to stop when done)
cloudflared tunnel run my-collections

# From a separate terminal or local machine:
curl -I https://api.yourdomain.com
```

### 4g. Install as a System Service

```shell
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared

# Verify it is running:
sudo launchctl list | grep cloudflared
```

The `sudo` here installs cloudflared as a LaunchDaemon — a system-level service that starts before any user logs in. This ensures the tunnel is available immediately after a reboot, before the auto-login process completes.

## Step 5 — Install GitHub Actions Self-Hosted Runner

The self-hosted runner polls GitHub over outbound HTTPS. No SSH credentials or open ports are required for CI/CD.

- In the GitHub repo, go to **Settings → Actions → Runners → New self-hosted runner**
- Select **macOS** and **ARM64** (for M4 Mac Mini)
- Follow the displayed instructions to download, extract, and configure the runner (they include a short-lived registration token)

```shell
# After ./config.sh completes, install as a launchd service:
sudo ./svc.sh install
sudo ./svc.sh start

# Verify:
sudo launchctl list | grep actions
```

Go to **GitHub → Settings → Actions → Runners** — the runner should appear as **Online**.

Deploy jobs in workflow files must use `runs-on: self-hosted` to run on this machine. Test and lint jobs can continue using `runs-on: ubuntu-latest` on GitHub-hosted runners.

## Step 6 — Hand Off to Claude Code

The machine is physically configured and network-connected. The application install — Node.js, PostgreSQL, pm2, production .env, migrations, and seeds — is mechanical but detailed. Claude Code drives this well.

```shell
# SSH into the Mac Mini
ssh username@mini.local

# Clone the repo
mkdir -p ~/Sites && cd ~/Sites
git clone https://github.com/<you>/my-collections.git
cd my-collections

# Install and start Claude Code
export ANTHROPIC_API_KEY=sk-ant-...
npm install -g @anthropic-ai/claude-code
claude
```

Open the session with: _"Read devops/CLAUDE.md and walk me through setting up this server from scratch. Check the Server Inventory checklist and start from the first uncompleted item."_ Claude Code will guide through Node.js, PostgreSQL, pm2, the .env file, migrations, and OAuth client seeds — explaining each step and logging to devops/setup-log.md.

## Step 7 — Post-Deploy Smoke Test

### Test the API Directly

```shell
# Health readiness probe — should return 200 with { "status": "ready", "db": "ok" }
curl -s https://api.yourdomain.com/health/ready | jq .

# Swagger docs — should return 200
curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/api/docs

# Auth endpoint — should return 400 validation error, not 502 or 404
curl -s -X POST https://api.yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

> **Load balancer / reverse proxy probe:** Use `GET /health/ready` as the readiness probe. It checks both the API process and the database connection. Use `GET /health` as the liveness probe (process alive only, no DB check). Neither endpoint requires authentication.

### Test the OAuth Flow from the Web Frontend

- Deploy the React build to Dreamhost shared hosting
- Navigate to https://yourdomain.com — should redirect to /login
- Log in with the account created during setup — should land on dashboard with no console errors
- Sign out — should return to /login

### Reboot Test

The definitive headless validation — confirm everything comes back after a cold restart:

```shell
sudo reboot

# Wait ~60 seconds, then SSH back in:
ssh username@mini.local

pm2 status                                              # my-collections-api should be online
sudo launchctl list | grep cloudflared                  # tunnel service running
sudo launchctl list | grep actions                      # runner service running
curl -s https://api.yourdomain.com/health/ready | jq .  # { "status": "ready", "db": "ok" }
```

If all four checks pass after the reboot, the Mac Mini is fully headless-ready and production-ready. Append the session to `devops/setup-log.md` before closing.
