---
confluence_page_id: "6356993"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/6356993"
title: "My Collections — Server Setup Runbook"
last_updated: "2026-05-12"
---

This runbook has three phases. **Step 0** is done on your existing development machine before the Mac Mini arrives. **Steps 1–2** require a monitor, keyboard, and mouse physically connected to the Mac Mini. **Steps 3–6** are done remotely over SSH after the monitor is unplugged.

## Step 0 — Pre-Arrival Checklist

All of these steps are done on your development machine or in web dashboards — no Mac Mini required. Completing them before the hardware arrives means Day 1 is physical setup only.

### 0a. Purchase a Static IP from Your ISP

> **Status: Ordered — awaiting provisioning.** Confirm the assigned IP before proceeding to Step 3.

A static IP is recommended before doing anything else — it is the foundation the rest of the network configuration depends on.

**Why it matters:** The Cloudflare Tunnel makes outbound connections and handles dynamic IP changes gracefully, but a static IP provides:

- A stable WAN address with no reconnection gaps when your home IP rotates
- Confirmation that your connection is not behind CGNAT (Carrier-Grade NAT). Some residential ISPs assign you a private IP behind a shared NAT pool — the tunnel still works, but you have no real routable public IP. A static IP guarantees you have one.
- A known IP for logging and allow-listing if you ever need emergency fallback access

**Steps:**

1. Log in to your ISP account portal or call support — ask for a "static IP add-on"
2. Pricing varies: $5–$20/month is typical for residential; some ISPs bundle it with a business tier
3. Once provisioned (usually same day), note the assigned IP address
4. Verify it is active — from any device behind your router: `curl ifconfig.me` — it should return the static IP

> **Note:** You typically do not need to reconfigure your router. The ISP either locks the DHCP lease to your static IP, or instructs you to configure PPPoE/static on the router's WAN interface. Follow their specific provisioning instructions.

### 0b. Create Cloudflare Account and Migrate DNS

> **Status: DONE.** Cloudflare account created, `houseoffunk.net` added, GoDaddy nameservers updated to Cloudflare, DNS propagated.

**Add the domain to Cloudflare:**

1. Sign up at cloudflare.com — free plan is sufficient
2. Click **Add a Site** → enter `houseoffunk.net`
3. Select the **Free plan** → Continue
4. Cloudflare scans and imports existing Dreamhost DNS records — review them carefully:
   - Keep all **A records** pointing to Dreamhost's servers (Cloudflare proxies; it does not host your files)
   - Keep all **MX records** for email — these must survive the migration intact
   - Remove any records that no longer apply
5. Add the record for the React SPA (the `api` and `ssh` CNAMEs are created automatically later):

| Name | Type | Value | Proxy |
|---|---|---|---|
| `collections` | CNAME | `houseoffunk.net` | Orange cloud ON |

6. Cloudflare displays two nameserver addresses — note them (e.g. `ada.ns.cloudflare.com`, `bart.ns.cloudflare.com`)

**Change nameservers at GoDaddy:**

7. Log in to GoDaddy → **My Products** → find `houseoffunk.net` → click **DNS**
8. Find the **Nameservers** section → click **Change** → select **Enter my own nameservers (advanced)**
9. Replace GoDaddy's (or Dreamhost's) nameservers with Cloudflare's two nameservers
10. Save. GoDaddy may warn that changing nameservers will affect your domain — this is expected. Dreamhost still hosts your files; Cloudflare takes over DNS resolution.
11. Propagation typically takes 30 minutes to 4 hours. Verify at dnschecker.org — look for `houseoffunk.net` NS records pointing to Cloudflare.

### 0c. Set Up Dreamhost Subdomains

> **Status: DONE.** `collections.houseoffunk.net` and `stage.houseoffunk.net` created in Dreamhost. SFTP/SSH shell username: `jfunkshell` (both subdomains share the same user).

The React SPA and its staging counterpart are deployed as static files to Dreamhost shared hosting.

1. Log in to Dreamhost panel → **Manage Websites** → **Add a Website**
2. Add `collections.houseoffunk.net` — Dreamhost assigns it to your shared hosting server
3. Repeat for `stage.houseoffunk.net` — same process
4. Note the hosting directories created (e.g. `~/collections.houseoffunk.net/` and `~/stage.houseoffunk.net/`) — these are where React builds are deployed

Also add the CNAME record for the staging subdomain in Cloudflare DNS:

| Name | Type | Value | Proxy |
|---|---|---|---|
| `stage` | CNAME | `houseoffunk.net` | Orange cloud ON |

Once DNS propagates, both subdomains resolve through Cloudflare to Dreamhost. Cloudflare provides HTTPS automatically — no SSL certificate configuration required in Dreamhost.

### 0d. Configure Cloudflare Access Application for SSH

> **Status: DONE.**

Cloudflare Access is an identity-aware authentication proxy that gates access to private resources — no VPN required. It sits in front of `mini.houseoffunk.net` and enforces identity verification before any connection reaches port 22 on the Mac Mini. Port 22 is never directly exposed to the internet; the Cloudflare Tunnel is the only path in, and Access guards that path.

In the Cloudflare dashboard → **Zero Trust** → **Access controls** → **Applications** → **Create new application** → **Self-hosted and private**. The form is a single scrolling page:

**Destinations (top of page)**

| Field | Value |
| --- | --- |
| Subdomain | `mini` |
| Domain | `houseoffunk.net` (select from dropdown) |
| Path | *(leave blank)* |

**Browser-based RDP/SSH/VNC sessions toggle** — leave **OFF**. This option renders a terminal inside a browser tab. We're using native SSH from the terminal via the `cloudflared` ProxyCommand instead — lower latency and no dependency on a browser.

**Access policies (scroll down)**

Click the **Builder** tab. Add a rule:

| Field | Value |
| --- | --- |
| Action | Allow |
| Rule selector | Emails |
| Value | `jfunk@houseoffunk.net` |

**Application name and session (further down, same page)**

| Field | Value |
| --- | --- |
| Application name | `Mac Mini SSH` |
| Session duration | 24 hours |
| Identity provider | Enable **One-time PIN** — Cloudflare emails a 6-digit code; no external IdP (Google, GitHub, Okta) required |

Save the application.

**How the OTP flow works end-to-end:**

```
ssh mini.houseoffunk.net
  → cloudflared (on dev machine) checks for a valid Access token
  → no valid token: opens a browser tab to Cloudflare Access
  → Cloudflare emails a one-time PIN to jfunk@houseoffunk.net
  → enter the PIN in the browser
  → Cloudflare issues a 24-hour session token (stored locally by cloudflared)
  → SSH connection proceeds to port 22 on the Mac Mini
  → sshd requires the Ed25519 private key — password auth is disabled
```

Within the 24-hour session window, subsequent `ssh mini.houseoffunk.net` commands skip the OTP prompt entirely — cloudflared presents the cached token silently. After 24 hours (or if the token is revoked), the OTP prompt appears again.

### 0e. Update Source Code: CORS and OAuth Redirect URIs

> **Status: DONE.**

Make these changes on the `develop` branch before the Mac Mini arrives. Commit and merge to `main` so the production server pulls correct code on day one.

**CORS (`packages/api/src/main.ts`)** — already implemented. The API uses an `ALLOWED_ORIGINS` environment variable (comma-separated list) with `credentials: true`. In production, set `ALLOWED_ORIGINS=https://collections.houseoffunk.net` in the server `.env`. No code change needed.

**OAuth redirect URIs (`packages/api/src/database/seeds/oauth-clients.seed.ts`)** — updated: replaced the `mycollections.example.com` placeholder with the production URL:

```typescript
redirectUris: [
  'http://localhost:5173/auth/callback',
  'https://collections.houseoffunk.net/auth/callback',
],
```

The seed runs once on the Mac Mini after the initial database migration (Step 5). The production redirect URI must exactly match what the web app sends in the OAuth `redirect_uri` parameter — any mismatch returns a 400 error.

**`.env.example`** — production and staging CORS values documented in comments:

```plaintext
# Production value: https://collections.houseoffunk.net
# Staging value:    https://stage.houseoffunk.net
ALLOWED_ORIGINS=http://localhost:5173
```

**Commit and merge:**

```shell
git add packages/api/src/database/seeds/oauth-clients.seed.ts
git add packages/api/.env.example
git commit -m "fix: update production OAuth redirect URI to collections.houseoffunk.net"
git push origin develop
# Open a PR and merge to main
```

### 0f. Deploy the React SPA to Dreamhost

> **Status: DONE.** Both `stage.houseoffunk.net` and `collections.houseoffunk.net` are live. CI/CD (`deploy-web-stage.yml`) verified working on first run.

The Dreamhost server hostname is `pdx1-shared-a1-13.dreamhost.com` and the web server IP is `69.163.182.190`. The `stage` and `collections` Cloudflare DNS records are A records pointing to this IP (gray cloud — DNS only). Dreamhost provisioned Let's Encrypt certificates automatically once DNS resolved correctly.

**One-time manual deploy (already done — kept for reference):**

```shell
# Staging — build with staging API URL baked in
VITE_API_BASE_URL=https://stage-api.houseoffunk.net npm run build --workspace=packages/web
rsync -avz --delete \
  -e "ssh -i ~/.ssh/dreamhost_deploy" \
  packages/web/dist/ \
  jfunkshell@pdx1-shared-a1-13.dreamhost.com:~/stage.houseoffunk.net/

# Production — rebuild with production API URL
VITE_API_BASE_URL=https://api.houseoffunk.net npm run build --workspace=packages/web
rsync -avz --delete \
  -e "ssh -i ~/.ssh/dreamhost_deploy" \
  packages/web/dist/ \
  jfunkshell@pdx1-shared-a1-13.dreamhost.com:~/collections.houseoffunk.net/
```

After the initial deploy, all future deploys are handled automatically by GitHub Actions — no manual rsync needed. API calls return errors until the Mac Mini is running, but the static hosting path is confirmed end-to-end.

### 0g. Prepare Production Secrets and SSH Keys

**Generate production JWT secrets:**

```shell
# Run each separately — these must be two different values
openssl rand -hex 64   # JWT_ACCESS_SECRET
openssl rand -hex 64   # JWT_REFRESH_SECRET
```

Save these to a password manager. They go into the production `.env` file during Step 5.

**Generate an Ed25519 SSH key pair for the Mac Mini:**

```shell
ssh-keygen -t ed25519 -C "mac-mini-server" -f ~/.ssh/mac_mini_ed25519
```

Save the public key (`~/.ssh/mac_mini_ed25519.pub`) somewhere accessible — it gets copied into `~/.ssh/authorized_keys` on the Mac Mini during Step 1.

**Install cloudflared on your dev machine:**

```shell
brew install cloudflare/cloudflare/cloudflared
```

Add the SSH ProxyCommand to `~/.ssh/config` on your dev machine:

```
Host mini.houseoffunk.net
    ProxyCommand cloudflared access ssh --hostname %h
    User <mac-mini-username>
    IdentityFile ~/.ssh/mac_mini_ed25519
```

This is what makes `ssh mini.houseoffunk.net` work transparently through the Cloudflare Access gate.

---

## Step 1 — Initial Mac Mini Setup (Monitor Attached)

Do all of Step 1 while the Mac Mini is connected to a monitor, keyboard, and mouse. This is the only time physical access is needed.

### First Boot and macOS Setup

Complete the macOS setup assistant. Create the server user account, connect to Ethernet (preferred over Wi-Fi for a server), and skip non-essential steps.

Configure the router to assign a static local IP to the Mac Mini via DHCP reservation using its MAC address — find the MAC address in **System Settings → Network → Ethernet → Details → Hardware**.

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

- Download new updates when available → ON
- Install macOS updates → **OFF** (automatic OS updates can trigger unexpected reboots)
- Install application updates from the App Store → **OFF**
- Install Security Responses and system files → ON (low-risk security patches are fine)

### Hardened SSH Configuration

Before enabling Remote Login, harden the SSH daemon. In Terminal:

```shell
sudo nano /etc/ssh/sshd_config
```

Set or confirm these values:

```
PasswordAuthentication no
PermitRootLogin no
AllowUsers <your-username>
```

Save and close. SSH connections will require key authentication — no password brute-forcing is possible even if port 22 were ever reachable.

### Remote Access (SSH and Screen Sharing)

Open **System Settings → General → Sharing** and enable:

- Remote Login (SSH) → ON
- Screen Sharing (VNC) → ON — allows GUI access from another Mac via Finder → Connect to Server → `vnc://mini.local`

**Install the SSH public key** generated in Step 0g:

```shell
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA... mac-mini-server" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Replace the `echo` content with the actual contents of `~/.ssh/mac_mini_ed25519.pub` from your dev machine.

Set a memorable hostname: **System Settings → General → Sharing → Local Hostname** → change to `mini`. This makes local SSH cleaner: `ssh username@mini.local`.

### Install Homebrew

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
source ~/.zprofile
brew --version
```

### Connect the Dummy HDMI Plug

Before unplugging the real monitor, plug a dummy HDMI plug into the Mac Mini's HDMI port. These cost $8–15 (search "HDMI dummy plug" or "HDMI headless ghost display emulator") and tell macOS that a display is connected, preventing GPU acceleration from being disabled and other display-dependent weirdness in headless mode.

---

## Step 2 — Verify SSH and Go Headless

Still with the monitor connected, test SSH and key authentication from another machine on the local network:

```shell
ssh -i ~/.ssh/mac_mini_ed25519 username@mini.local
hostname
uptime
```

Once SSH is confirmed working, unplug the monitor (the dummy HDMI plug stays in), then the keyboard and mouse. The Mac Mini is now headless. Verify from the other machine:

```shell
ssh username@mini.local
hostname    # Mac Mini hostname
uptime      # Should show running time
```

All remaining steps are done via SSH.

---

## Step 3 — Set Up Cloudflare Tunnel

The Cloudflare Tunnel routes all public traffic to the Mac Mini without opening any ports on the home router. SSL is handled by Cloudflare automatically. **The home router has zero open inbound ports at any point in this setup.**

### 3a. Install and Authenticate cloudflared

```shell
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel login
```

The login command prints a URL. Open it in a browser, select `houseoffunk.net`, and authorize. This writes a certificate to `~/.cloudflared/cert.pem`.

### 3b. Create the Tunnel

```shell
cloudflared tunnel create my-collections
```

Note the tunnel ID printed in the output — it is needed for the config file and DNS records.

### 3c. Create the Config File

```shell
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: <tunnel-id>
credentials-file: /Users/<username>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: mini.houseoffunk.net
    service: ssh://localhost:22
  - hostname: api.houseoffunk.net
    service: http://localhost:3000
  - hostname: stage-api.houseoffunk.net
    service: http://localhost:3001
  - service: http_status:404
```

The final `http_status:404` catch-all rule is required by cloudflared — it handles any request that does not match a hostname rule. Omitting it causes the tunnel to fail to start.

The `stage-api` entry routes the staging API subdomain to port 3001, where the staging pm2 process will listen. It can be added now (before the staging setup in Step 5) without any side effects — the tunnel will return 502 for that hostname until the staging API is running.

### 3d. Configure DNS

```shell
cloudflared tunnel route dns my-collections api.houseoffunk.net
cloudflared tunnel route dns my-collections mini.houseoffunk.net
cloudflared tunnel route dns my-collections stage-api.houseoffunk.net
```

These commands create CNAME records in Cloudflare DNS pointing each subdomain to `<tunnel-id>.cfargotunnel.com`. The records are created with the orange cloud (Cloudflare proxy) ON automatically.

### 3e. Test Manually

```shell
# Start the tunnel manually to test (Ctrl+C to stop when done)
cloudflared tunnel run my-collections

# From a separate terminal or local machine:
curl -I https://api.houseoffunk.net
```

### 3f. Install as a System Service

```shell
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared

# Verify it is running:
sudo launchctl list | grep cloudflared
```

Installing with `sudo` creates a LaunchDaemon — a system-level service that starts before any user logs in. This ensures the tunnel is available immediately after a reboot, before the auto-login process completes.

### 3g. Verify SSH via Cloudflare Access

On your dev machine (not the Mac Mini), test the full SSH tunnel:

```shell
ssh mini.houseoffunk.net
```

`cloudflared` intercepts the connection, opens a browser tab, Cloudflare sends a one-time PIN to `jfunk@houseoffunk.net`, you enter the PIN, and the SSH connection completes using the Ed25519 key. Subsequent connections within the 24-hour session window skip the PIN.

If the browser does not open automatically:

```shell
cloudflared access ssh --hostname mini.houseoffunk.net
```

> **Security model summary:** The home router has zero open inbound ports. Port 22 on the Mac Mini is only reachable through the Cloudflare Tunnel (`mini.houseoffunk.net`) after the Access policy is satisfied (email OTP). macOS `sshd` requires key authentication — passwords are disabled. An attacker would need to compromise your email account, your Cloudflare session, AND your private SSH key. Note: `ssh.houseoffunk.net` is a separate DNS record pointing to Dreamhost's shared hosting servers — it is unrelated to this tunnel.

---

## Step 4 — Install GitHub Actions Self-Hosted Runner

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

Once the runner is online, the API deploy workflow (`deploy-api.yml`) triggers automatically on every push to `main` that touches `packages/api/` or `packages/shared/`. See the [CI/CD Runbook](ci-cd-runbook.md) for full pipeline documentation, the web deploy setup, and the GitHub secrets inventory.

---

## Step 5 — Hand Off to Claude Code

The machine is physically configured and network-connected. The application install — Node.js, PostgreSQL, pm2, production .env, migrations, and seeds — is mechanical but detailed. Claude Code drives this well.

```shell
# SSH into the Mac Mini via Cloudflare Access tunnel
ssh mini.houseoffunk.net

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

### Staging Environment Setup

After production is verified, set up the staging environment on the same machine. Run the following from the Mac Mini (via SSH or in the Claude Code session):

**Create the staging database:**

```shell
psql -U postgres -c "CREATE DATABASE my_collections_stage;"
# Grant the app user access:
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE my_collections_stage TO my_collections;"
```

**Clone the repo to the staging directory on the develop branch:**

```shell
cd ~/Sites
git clone https://github.com/<you>/my-collections.git my-collections-stage
cd my-collections-stage
git checkout develop
```

**Create the staging `.env`:**

```shell
nano packages/api/.env
```

```
PORT=3001
DATABASE_URL=postgresql://my_collections:<password>@localhost:5432/my_collections_stage
JWT_ACCESS_SECRET=<openssl rand -hex 64 — unique value, different from production>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<openssl rand -hex 64 — different from JWT_ACCESS_SECRET>
JWT_REFRESH_EXPIRES_IN=30d
REGISTRATION_ENABLED=true
ALLOWED_ORIGIN=https://stage.houseoffunk.net
```

**Install, build, and run migrations:**

```shell
cd ~/Sites/my-collections-stage
npm ci
npm run build -- --filter=@my-collections/api
cd packages/api
npm run migration:run
```

**Seed OAuth clients (with staging redirect URIs):**

```shell
# From ~/Sites/my-collections-stage:
npm run seed:oauth-clients
```

The seed script uses `ALLOWED_ORIGIN` from `.env` to set redirect URIs — staging redirects will point to `https://stage.houseoffunk.net/auth/callback`.

**Start the staging API as a pm2 process:**

```shell
cd ~/Sites/my-collections-stage/packages/api
pm2 start dist/main.js --name my-collections-api-stage
pm2 save
```

**Verify:**

```shell
curl -s https://stage-api.houseoffunk.net/health/ready | jq .
# Expected: { "status": "ready", "db": "ok" }
```

The staging environment is now live. Pushes to the `develop` branch automatically deploy to it via the `deploy-api-stage.yml` and `deploy-web-stage.yml` workflows.

---

## Step 6 — Post-Deploy Smoke Test

### Test the API Directly

```shell
# Health readiness probe — should return 200 with { "status": "ready", "db": "ok" }
curl -s https://api.houseoffunk.net/health/ready | jq .

# Swagger docs — should return 200
curl -s -o /dev/null -w "%{http_code}" https://api.houseoffunk.net/api/docs

# Auth endpoint — should return 400 validation error, not 502 or 404
curl -s -X POST https://api.houseoffunk.net/auth/register \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

> **Load balancer / reverse proxy probe:** Use `GET /health/ready` as the readiness probe. It checks both the API process and the database connection. Use `GET /health` as the liveness probe (process alive only, no DB check). Neither endpoint requires authentication.

### Test the OAuth Flow from the Web Frontend

- Navigate to `https://collections.houseoffunk.net` — should redirect to `/login`
- Log in with the account created during setup — should land on dashboard with no console errors
- Sign out — should return to `/login`

### Reboot Test

The definitive headless validation — confirm everything comes back after a cold restart:

```shell
sudo reboot

# Wait ~60 seconds, then SSH back in (Cloudflare Access OTP prompt again):
ssh mini.houseoffunk.net

pm2 status                                                # my-collections-api should be online
sudo launchctl list | grep cloudflared                    # tunnel service running
sudo launchctl list | grep actions                        # runner service running
curl -s https://api.houseoffunk.net/health/ready | jq .   # { "status": "ready", "db": "ok" }
```

If all four checks pass after the reboot, the Mac Mini is fully headless-ready and production-ready. Append the session to `devops/setup-log.md` before closing.
