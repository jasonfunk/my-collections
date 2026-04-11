# Mac Mini Setup Runbook

Human-facing manual steps for setting up the my-collections Mac Mini server.
These are the things that require a person — web dashboards, physical hardware interaction,
or one-time decisions that can't be automated.

**Phase 1 (Steps 1–3):** Do with a monitor, keyboard, and mouse attached.
**Phase 2 (Steps 4–7):** All done remotely via SSH after the monitor is unplugged.

---

## Step 1 — Pre-flight: Source Repo Changes

Do these in your **local development environment** before touching the Mac Mini.
They must be committed to `main` before any production deploy.

### 1a. Update OAuth redirect URIs

Open `packages/api/src/database/seeds/oauth-clients.seed.ts` and replace the placeholder
production URI with your actual Dreamhost frontend domain:

```
# Find this:
https://mycollections.example.com/auth/callback

# Replace with your actual URL, e.g.:
https://collections.yourdomain.com/auth/callback
```

> **Why:** The OAuth PKCE flow does an exact string match between the `redirect_uri` the client
> sends and what's registered in the database. A mismatch causes authorization to fail with a
> cryptic error. Fix it in seed data now so the production DB is correct from the start.

### 1b. Restrict CORS to your frontend origin

Open `packages/api/src/main.ts` and update the CORS setup:

```typescript
// Replace:
app.enableCors();

// With:
app.enableCors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true,
});
```

Add `ALLOWED_ORIGIN` to `packages/api/.env.example`:

```
ALLOWED_ORIGIN=https://collections.yourdomain.com
```

> **Why:** Wide-open CORS means any website can make authenticated requests to your API from
> a user's browser. Restricting to your frontend domain is basic production security posture.

### 1c. Commit and merge

```bash
git add packages/api/src/database/seeds/oauth-clients.seed.ts
git add packages/api/src/main.ts
git add packages/api/.env.example
git commit -m "fix: restrict CORS and update production OAuth redirect URIs"
git push origin develop
# Then open a PR and merge to main
```

---

## Step 2 — Initial Mac Mini Setup (monitor attached)

Do all of this while the Mac Mini is connected to a monitor, keyboard, and mouse.
This is the only time you'll need physical access.

### 2a. First boot and macOS setup

Complete the macOS setup assistant — create your user account, connect to Wi-Fi
(or Ethernet — preferred for a server), sign into Apple ID if desired, skip anything
non-essential.

> **Use a static local IP.** Configure your router to assign a fixed IP to the Mac Mini's
> MAC address (DHCP reservation). This ensures the machine is always at the same local IP,
> which matters for SSH and any local tooling.

### 2b. macOS system updates

System Settings → General → Software Update → install all available updates.
This may require a reboot.

### 2c. Configure for headless operation

These settings are critical. Without them, the Mac Mini may sleep after you unplug the monitor.

**Energy:**
System Settings → Energy:
- Turn display off: set to a short timeout (it won't matter once headless, but set it)
- "Prevent automatic sleeping when the display is off" → **ON**
- "Wake for network access" → **ON**
- "Start up automatically after a power failure" → **ON**

> **Why restart after power failure?** If your power goes out and comes back, the Mac Mini
> should restart automatically without you needing to physically press the power button.

**Auto-login:**
System Settings → Users & Groups → click your user → "Automatically log in as [user]" → **ON**

> **Why auto-login?** pm2, the GitHub Actions runner, and other user-space services (LaunchAgents)
> only start after a user logs in. Without auto-login, a reboot leaves the server with no running
> services until someone manually logs in.

> **FileVault must be OFF for auto-login to work.** FileVault encrypts the disk and requires
> a password before the OS can finish booting — it physically cannot auto-login. Leave FileVault
> disabled on this machine. Your data is on a home network behind a firewall and Cloudflare Tunnel;
> the security trade-off is acceptable.

**Software update — disable auto-install:**
System Settings → General → Software Update → "Automatic updates" → click the (i) info button:
- "Download new updates when available" → ON (you want to know about them)
- "Install macOS updates" → **OFF**
- "Install application updates from the App Store" → **OFF**
- "Install Security Responses and system files" → ON (security patches are fine)

> **Why?** An automatic macOS update can trigger an unexpected reboot, taking your server
> offline. You want to control when updates and reboots happen.

**Remote Login (SSH):**
System Settings → General → Sharing → Remote Login → **ON**
Note the hostname shown (e.g., `minis-mac-mini.local`) — this is your Bonjour hostname.

**Screen Sharing (VNC):**
System Settings → General → Sharing → Screen Sharing → **ON**

> **Why Screen Sharing?** Even headlessly, you may occasionally need GUI access — to change a
> System Setting, troubleshoot a graphical issue, or just check something. Screen Sharing lets
> you connect from another Mac via Finder → Go → Connect to Server → `vnc://mini.local`.

**Set a hostname:**
System Settings → General → Sharing → Local Hostname → change to something memorable, e.g., `mini`
This makes SSH cleaner: `ssh username@mini.local`

### 2d. Install Homebrew

Open Terminal on the Mac Mini and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the prompts. At the end, the installer will print commands to add Homebrew to your PATH.
Run those commands (they add a line to `~/.zprofile`), then verify:

```bash
source ~/.zprofile
brew --version
```

> **Why Homebrew?** Homebrew is the de facto package manager for macOS. It handles PostgreSQL,
> cloudflared, and most server software you'll need. Think of it as `apt` for macOS.

### 2e. Connect the dummy HDMI plug

Before unplugging the real monitor, plug a **dummy HDMI plug** into the Mac Mini's HDMI port.
These are inexpensive ($8–15) and tell macOS a display is connected, preventing it from
disabling GPU acceleration and certain display-dependent features in headless mode.

You can find them by searching "HDMI dummy plug" or "HDMI headless ghost display emulator."

---

## Step 3 — Verify SSH and Go Headless

Still with the monitor connected, test SSH from **another machine on your network**:

```bash
ssh username@mini.local
# or
ssh username@<local-ip>
```

If that works, you're ready to go headless.

1. Unplug the monitor (the dummy HDMI plug stays in)
2. Unplug the keyboard and mouse
3. The Mac Mini is now a headless server

Verify it's still accessible from your other machine:

```bash
ssh username@mini.local
hostname    # Should print the Mac Mini's hostname
uptime      # Should show it's been running
```

All remaining steps are done via SSH.

---

## Step 4 — Set Up Cloudflare Tunnel + DNS

The Cloudflare Tunnel routes public internet traffic to your Mac Mini without exposing your
home IP or opening any ports on your router. This replaces the traditional nginx + certbot +
port forwarding setup.

### 4a. Create a Cloudflare account

Go to cloudflare.com and sign up for a free account if you don't have one.

### 4b. Add your domain to Cloudflare (choose one option)

**Option A — Move DNS to Cloudflare (recommended for full benefits):**
1. In the Cloudflare dashboard, click "Add a site" and enter your domain
2. Choose the Free plan
3. Cloudflare will scan your existing DNS records and import them
4. Cloudflare will give you two nameserver hostnames (e.g., `amy.ns.cloudflare.com`)
5. Log in to your domain registrar and update the nameservers to Cloudflare's
6. Wait for propagation (minutes to hours; Cloudflare emails you when it's active)

> **Why?** With Cloudflare managing DNS, you get DDoS protection, the orange-cloud proxy
> (hides your real IPs), and `cloudflared tunnel route dns` can auto-create CNAME records.

**Option B — Keep Dreamhost DNS, add a CNAME manually:**
Skip to Step 4c. After creating the tunnel, you'll manually add a CNAME in Dreamhost DNS:
- **Name:** `api`
- **Type:** `CNAME`
- **Value:** `<tunnel-id>.cfargotunnel.com`

You get the tunnel benefits without moving DNS. Simpler, but less Cloudflare protection.

### 4c. Install and authenticate cloudflared (on the Mac Mini via SSH)

```bash
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel login
```

The login command prints a URL. Open it in a browser, select your domain, and authorize.
This creates a certificate at `~/.cloudflared/cert.pem`.

### 4d. Create the tunnel

```bash
cloudflared tunnel create my-collections
```

This creates a tunnel and writes its credentials to `~/.cloudflared/<tunnel-id>.json`.
Note the tunnel ID printed in the output — you'll need it.

### 4e. Create the tunnel config file

```bash
nano ~/.cloudflared/config.yml
```

Paste this (replace values in angle brackets):

```yaml
tunnel: <tunnel-id>
credentials-file: /Users/<username>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

> **What this does:** Any request arriving at `api.yourdomain.com` via the tunnel is forwarded
> to `localhost:3000` on this machine. The final `http_status:404` rule is required — it catches
> any request that doesn't match a hostname rule.

> **Optional — SSH tunnel ingress:** If you want remote SSH access through Cloudflare, add
> this rule above the 404 catch-all:
> ```yaml
>   - hostname: ssh.yourdomain.com
>     service: ssh://localhost:22
> ```

### 4f. Configure DNS

If using Cloudflare DNS (Option A):
```bash
cloudflared tunnel route dns my-collections api.yourdomain.com
# If adding SSH tunnel:
cloudflared tunnel route dns my-collections ssh.yourdomain.com
```

If using Dreamhost DNS (Option B): manually add the CNAME records in the Dreamhost panel.

### 4g. Test the tunnel manually

First ensure the API is running (or at least something on port 3000 — even `npx serve` works):
```bash
cloudflared tunnel run my-collections
```

In another terminal (or from your local machine):
```bash
curl -I https://api.yourdomain.com
```

Should return an HTTP response (200, 404, or similar — not a connection error).
Ctrl+C to stop the manual run once confirmed.

### 4h. Install cloudflared as a system service

```bash
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared
```

> **Why `sudo`?** cloudflared is installed as a LaunchDaemon (system-level service that starts
> before any user logs in). This is important — it means the tunnel is up even before auto-login
> completes, so the API is reachable immediately after a reboot.

Verify it's running:
```bash
sudo launchctl list | grep cloudflared
```

---

## Step 5 — Install GitHub Actions Self-Hosted Runner

Instead of GitHub Actions SSHing into the Mac Mini, the runner lives on the Mac Mini and
connects **outbound** to GitHub. This means zero inbound ports for CI/CD.

1. In your GitHub repo, go to: **Settings → Actions → Runners → New self-hosted runner**
2. Select **macOS** and **ARM64** (for M4 Mac Mini)
3. Follow the displayed instructions — they'll look roughly like:

```bash
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-osx-arm64-<version>.tar.gz -L <github-url>
tar xzf ./actions-runner-osx-arm64-<version>.tar.gz
./config.sh --url https://github.com/<you>/<repo> --token <token>
```

4. Install as a launchd service so it starts automatically:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

5. Verify: go to GitHub → Settings → Actions → Runners — the runner should show as **Online**.

> **Why a self-hosted runner?** The runner polls GitHub for jobs over an outbound HTTPS connection.
> No SSH, no open ports, no secrets for VPS_HOST/USER/SSH_KEY. The runner has direct access
> to the repo's files and can run `npm build` and `pm2 restart` directly.

> **Label awareness:** Self-hosted runners get a `self-hosted` label by default. Your GitHub
> Actions workflow files will need `runs-on: self-hosted` (instead of `runs-on: ubuntu-latest`)
> for deploy jobs that should run on this machine.

---

## Step 6 — Hand Off to Claude Code

The machine is now physically configured and network-connected. The application install —
Node.js, PostgreSQL, pm2, migrations, seeds — is mechanical but detailed. Claude Code drives
this well with guidance.

1. SSH into the Mac Mini
2. Clone the repo (if not already done):
   ```bash
   mkdir -p ~/Sites && cd ~/Sites
   git clone https://github.com/<you>/my-collections.git
   cd my-collections
   ```
3. Start a Claude Code session:
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   claude
   ```
4. Open with: _"Read devops/CLAUDE.md and walk me through setting up this server from scratch.
   Check the Server Inventory checklist and start from the first uncompleted item."_

Claude Code will guide you through Node.js, PostgreSQL, pm2, the production .env, migrations,
and seeds — explaining each step and logging everything to `devops/setup-log.md`.

---

## Step 7 — Post-Deploy Smoke Test

After the server is fully configured, verify end-to-end.

### Test the API directly

```bash
# Swagger docs (should return 200 HTML)
curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/api/docs

# Auth endpoint (should return 400 validation error, not 502/404)
curl -s -X POST https://api.yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

### Test the OAuth flow from the web frontend

1. Deploy the React build to Dreamhost shared hosting
2. Navigate to `https://yourdomain.com` in a browser
3. Should redirect to `/login`
4. Log in with your account (created during setup)
5. Should land on the dashboard with no console errors
6. Test sign-out → returns to `/login`

### Verify SSL (Cloudflare provides it, but confirm it's working)

```bash
echo | openssl s_client -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -issuer -dates
# Issuer should reference Cloudflare, not Let's Encrypt
```

### Simulate a reboot (important headless test)

```bash
sudo reboot
```

Wait ~60 seconds, then SSH back in and confirm:
- `pm2 status` → `my-collections-api` is online
- `sudo launchctl list | grep cloudflared` → tunnel service is running
- `sudo launchctl list | grep actions` → runner service is running
- `curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/api/docs` → 200

If the reboot test passes, the machine is genuinely headless-ready and production-ready.
Record the session in `devops/setup-log.md`.
