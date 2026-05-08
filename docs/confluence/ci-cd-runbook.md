---
confluence_page_id: "15237122"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/15237122"
title: "My Collections — CI/CD Runbook"
last_updated: "2026-05-05"
---

Four GitHub Actions pipelines deploy this project to two environments. They trigger independently based on which branch was pushed and which packages changed.

| Workflow | Trigger | Runner | Environment | Target |
|---|---|---|---|---|
| `ci.yml` | PR to `main` or `develop` | ubuntu-latest | — | Lint + test only |
| `build.yml` | Push to `main` | ubuntu-latest | — | Build verification only |
| `audit.yml` | PR + weekly schedule | ubuntu-latest | — | npm audit only |
| `deploy-web.yml` | Push to `main` touching `packages/web/**` or `packages/shared/**` | ubuntu-latest | `production` | Dreamhost — `collections.houseoffunk.net` |
| `deploy-api.yml` | Push to `main` touching `packages/api/**` or `packages/shared/**` | self-hosted (Mac Mini) | `production` | `~/Sites/my-collections/` |
| `deploy-web-stage.yml` | Push to `develop` touching `packages/web/**` or `packages/shared/**` | ubuntu-latest | `staging` | Dreamhost — `stage.houseoffunk.net` |
| `deploy-api-stage.yml` | Push to `develop` touching `packages/api/**` or `packages/shared/**` | self-hosted (Mac Mini) | `staging` | `~/Sites/my-collections-stage/` |

`packages/shared/**` changes trigger both deploy pipelines since both the web app and the API depend on the shared types package.

## GitHub Environments

Rather than duplicating secrets with a `-STAGE` suffix, workflows use [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment). Each workflow declares `environment: production` or `environment: staging` in its job — GitHub injects the right variable values automatically.

**Configure environments in:** GitHub repo → **Settings → Environments**

### Repository-level (shared by all workflows)

| Name | Type | Value |
|---|---|---|
| `DREAMHOST_SSH_KEY` | Secret | Ed25519 private key for Dreamhost deploy (see setup below) |
| `DREAMHOST_HOST` | Variable | Dreamhost server hostname (e.g. `nova.dreamhost.com`) |
| `DREAMHOST_USER` | Variable | Dreamhost shell username |

### `production` environment variables

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://api.houseoffunk.net` |
| `DREAMHOST_DIR` | `~/collections.houseoffunk.net/` |

### `staging` environment variables

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://stage-api.houseoffunk.net` |
| `DREAMHOST_DIR` | `~/stage.houseoffunk.net/` |

The API deploy workflows (`deploy-api.yml` and `deploy-api-stage.yml`) use no GitHub secrets — they run directly on the Mac Mini via the self-hosted runner with local git credentials and pm2 access.

> **Optional approval gate:** The `production` environment can have a **Required reviewers** rule added (Settings → Environments → production → Deployment protection rules). This creates a manual approval step before any production deploy runs — useful for enforcing a deliberate promotion from staging.

---

## Web Deploy Pipeline

**Files:** `.github/workflows/deploy-web.yml` (production), `.github/workflows/deploy-web-stage.yml` (staging)

**What it does:** Checks out the repo on a GitHub-hosted Ubuntu runner, installs dependencies, builds the React SPA (with `VITE_API_BASE_URL` baked in at build time), and rsyncs the `dist/` output to the appropriate Dreamhost directory via SSH. The `--delete` flag ensures stale files from previous builds are removed.

**Concurrency:** Both workflows use `cancel-in-progress: true` — if two web deploys queue up, the older one is dropped in favour of the newer. Safe for a static file deploy.

| | Production | Staging |
|---|---|---|
| Trigger branch | `main` | `develop` |
| `VITE_API_BASE_URL` | `https://api.houseoffunk.net` | `https://stage-api.houseoffunk.net` |
| Dreamhost directory | `~/collections.houseoffunk.net/` | `~/stage.houseoffunk.net/` |
| URL | `https://collections.houseoffunk.net` | `https://stage.houseoffunk.net` |

### One-Time Setup

**1. Generate the Dreamhost deploy key:**

```shell
ssh-keygen -t ed25519 -C "dreamhost-deploy" -f ~/.ssh/dreamhost_deploy
```

This key is only for GitHub Actions → Dreamhost. Keep it separate from the Mac Mini SSH key (`mac_mini_ed25519`) generated in the Server Setup Runbook.

**2. Add the public key to Dreamhost:**

In the Dreamhost panel → **Users → Manage Users** → click the shell user → **SSH Keys** → paste the contents of `~/.ssh/dreamhost_deploy.pub` and save.

**3. Find your Dreamhost server hostname:**

In the Dreamhost panel → **Users → Manage Users** → click the shell user. The SSH connection info shows the hostname (e.g. `nova.dreamhost.com`). This is the value for the `DREAMHOST_HOST` variable.

**4. Add secrets and variables to GitHub:**

In the GitHub repo → **Settings → Secrets and variables → Actions**:

- **Secrets → New repository secret:**
  - `DREAMHOST_SSH_KEY` → paste the full contents of `~/.ssh/dreamhost_deploy` (the private key)

- **Variables → New repository variable:**
  - `DREAMHOST_HOST` → your Dreamhost server hostname
  - `DREAMHOST_USER` → your Dreamhost shell username

Then in **Settings → Environments**, create `production` and `staging` environments and add their respective variables as shown in the table above.

**5. Verify:**

Push a trivial change to `packages/web/` on `main` and confirm the Actions run completes and `https://collections.houseoffunk.net` reflects the change. Repeat on `develop` to confirm staging.

---

## API Deploy Pipeline

**Files:** `.github/workflows/deploy-api.yml` (production), `.github/workflows/deploy-api-stage.yml` (staging)

**Prerequisites:** The Mac Mini must be running with the self-hosted runner online. See Step 4 of the [Server Setup Runbook].

**What it does:** Runs directly on the Mac Mini via the self-hosted runner. Pulls latest code into the appropriate working directory, installs dependencies, builds the API, runs any pending TypeORM migrations, then restarts the correct pm2 process.

**Concurrency:** Both workflows use `cancel-in-progress: false` — a mid-deploy cancellation after migrations have run but before pm2 restarts would leave the API in a broken state. Queued deploys wait for the running one to finish.

| | Production | Staging |
|---|---|---|
| Trigger branch | `main` | `develop` |
| Working directory | `~/Sites/my-collections/` | `~/Sites/my-collections-stage/` |
| pm2 process | `my-collections-api` | `my-collections-api-stage` |
| Port | 3000 | 3001 |
| Database | `my_collections` | `my_collections_stage` |
| API URL | `https://api.houseoffunk.net` | `https://stage-api.houseoffunk.net` |

### Migration Safety

Migrations run automatically on every API deploy. Before merging any PR that includes a migration to `main` or `develop`:

- Confirm the migration is backward-compatible with the current running code (add-only changes are safe; column renames or drops require a two-step deploy)
- Run `npm run migration:show` locally to review what is pending
- If a migration must be rolled back after deploy: SSH into the Mac Mini and run `npm run migration:revert` from the appropriate `packages/api/` directory

### No GitHub Secrets Required

The runner executes on the Mac Mini itself with direct filesystem access. It uses whatever git credentials were configured when each repo was cloned in Step 5 of the Server Setup Runbook. No `VPS_HOST`, `VPS_USER`, or `VPS_SSH_KEY` secrets are needed.

---

## Key Rotation

**Rotating `DREAMHOST_SSH_KEY`:**

1. Generate a new key pair: `ssh-keygen -t ed25519 -C "dreamhost-deploy-new" -f ~/.ssh/dreamhost_deploy_new`
2. Add the new public key to Dreamhost (panel → Users → SSH Keys) — add it alongside the existing key, not replacing it yet
3. Update the `DREAMHOST_SSH_KEY` GitHub secret with the new private key
4. Trigger a deploy and confirm it succeeds
5. Remove the old public key from Dreamhost

This zero-downtime rotation ensures a failed deploy doesn't lock you out mid-rotation.
