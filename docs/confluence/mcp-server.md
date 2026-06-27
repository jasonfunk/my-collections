---
confluence_page_id: "31752194"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/31752194"
title: "My Collections — MCP Server"
last_updated: "2026-06-27"
---

## Overview

The MCP (Model Context Protocol) server exposes the My Collections database as a set of tools that Claude can call in any interface — claude.ai web, Claude Desktop, or the Claude mobile app. This enables natural-language interaction with the collection without opening the web or mobile app: "which combiners am I missing?", "add this figure I found at a toy show", or "what's on my He-Man critical wishlist?"

The server lives at `mcp.houseoffunk.net` on the Mac Mini, using the Streamable HTTP transport from MCP spec v2025-03-26. It is a thin wrapper over the existing Collections REST API — all business logic stays in NestJS.

## Architecture

```
Claude (claude.ai / Desktop / mobile)
        │ HTTPS  Bearer token
        ▼
mcp.houseoffunk.net   (packages/mcp — Express + MCP SDK)
        │ HTTPS  Bearer JWT
        ▼
api.houseoffunk.net   (packages/api — NestJS REST API)
        │
        ▼
PostgreSQL 16 (Mac Mini)
```

**Transport:** Streamable HTTP (`POST /mcp` + `GET /mcp` for SSE upgrades). Handled by `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk`.

**Package:** `@my-collections/mcp` — plain TypeScript Node.js server (not NestJS). Uses Express as the HTTP wrapper.

## Auth Flow

There are two separate auth layers.

### Layer 1 — Claude → MCP server

A static bearer token (`MCP_BEARER_TOKEN`) is validated by middleware on every request. This token is configured once in claude.ai settings and Claude Desktop config. It never changes unless rotated manually.

The token is passed as a URL query parameter: `https://mcp.houseoffunk.net/mcp?token=<MCP_BEARER_TOKEN>`

### Layer 2 — MCP server → Collections API

The MCP server authenticates as the collection owner via a stored refresh token. This token is obtained once via a one-time bootstrap script and saved to `packages/mcp/.env`.

**Bootstrap flow (run once per environment):**

1. Run `npm run bootstrap` in `packages/mcp` (interactive — requires a TTY: `ssh -t mini.local "..."`)
2. The script prompts for email and password via readline — no browser required; the API has no HTML login page
3. It performs PKCE internally and exchanges credentials for tokens
4. `MCP_REFRESH_TOKEN` is written to `packages/mcp/.env`

**Runtime flow:**

- On startup, the MCP server calls `POST /auth/token` with `grantType: refresh_token`
- It holds the resulting access token in memory and attaches it as `Authorization: Bearer` to all API calls
- 2 minutes before expiry, the token is automatically refreshed

The `mcp-server` OAuth client is registered in the API with redirect URI `http://localhost:9999/callback`.

## Tool Catalog

### Read Tools

| Tool | API Endpoint | Description |
|---|---|---|
| `get_collection_stats` | `GET /collections/stats` | Owned/wishlist counts and total estimated value across all 3 collections |
| `get_wishlist` | `GET /collections/{type}/wishlist` | All wishlist items for one or all collection types |
| `get_owned_items` | `GET /collections/{type}/items` | Paginated owned items with optional search filter |
| `get_item_details` | `GET /collections/{type}/items/:id` | Full record: accessories, condition, acquisition metadata |
| `get_catalog_item` | `GET /collections/{type}/catalog/:id` | Full catalog entry: accessories list, release year, variant info |
| `browse_catalog` | `GET /collections/{type}/catalog` | Search the master catalog (not just owned items) |
| `search_collection` | `GET /collections/search` | Cross-collection search with `isOwned`, `isComplete`, `condition` filters |
| `get_recent_additions` | `GET /collections/recent` | Items added recently (up to 20, sorted newest first) |

### Write Tools

| Tool | API Endpoint | Description |
|---|---|---|
| `add_to_collection` | `POST /collections/{type}/items` | Add an owned item or wishlist entry |
| `update_item` | `PATCH /collections/{type}/items/:id` | Update condition, accessories, notes, value, etc. |
| `mark_wishlist_acquired` | `PATCH /collections/{type}/items/:id/acquired` | Convert wishlist → owned; record condition, source, price |
| `remove_from_collection` | `DELETE /collections/{type}/items/:id` | Remove an item from the collection |
| `upload_photo` | `POST /collections/photos/upload` | Attach a photo to a collection item (accepts base64 data) |

`{type}` is one of: `star-wars`, `transformers`, `he-man`

## Compound Use Cases

These examples show how Claude chains multiple tool calls to answer a single natural-language question.

### "Which Transformers gestalts are complete?"

1. `browse_catalog('transformers', { isCombiner: true })` — get all combiner members, grouped by `combinerTeam`
2. `search_collection('transformers', { isOwned: true })` — get owned Transformers
3. Claude cross-references names within each `combinerTeam`

**Example response:** "Devastator ✅ complete. Superion: missing Skydive and Air Raid. Bruticus: missing Brawl."

---

### "I found a Hammerhead at a toy show for $40 — good deal? Add it if so."

1. `search_collection('star-wars', { q: 'Hammerhead' })` — locate the catalog entry
2. `get_catalog_item(id)` — get accessories list and reference data
3. Claude compares $40 to `estimatedValue` and checks wishlist priority
4. If user confirms: `add_to_collection(...)` with condition + acquisitionPrice

---

### "What accessories am I missing across my Star Wars collection?"

1. `get_owned_items('star-wars', { isComplete: false })` — all incomplete items
2. `get_item_details(id)` for each — catalog `accessories` vs. user's `ownedAccessories`
3. Claude diffs the two arrays per item

**Example response:** "Luke Skywalker: missing Lightsaber. Boba Fett: missing Blaster Pistol. R2-D2: missing Periscope."

---

### "Show me my He-Man critical wishlist — I'm at a toy show."

1. `get_wishlist('he-man')` — all He-Man wishlist items
2. Claude filters to `wishlistPriority: CRITICAL` and formats compactly

**Example response:** "Faker (CRITICAL, ~$85). Clawful (CRITICAL, ~$30). Webstor (CRITICAL, ~$45)."

---

### "Add this photo to my Optimus Prime entry"

1. User shares photo in the Claude conversation → Claude visually identifies the figure
2. `search_collection('transformers', { q: 'Optimus Prime', isOwned: true })` — get the item ID
3. `upload_photo(base64ImageData)` — returns a hosted photo URL
4. `update_item(id, { photoUrls: [...existing, newUrl] })` — attaches the photo

---

### "What % of the vintage Star Wars line do I own?"

1. `browse_catalog('star-wars', { line: 'VINTAGE' })` — full vintage catalog count
2. `get_owned_items('star-wars')` — what's owned
3. Claude calculates percentage and lists missing figures

**Example response:** "You own 47 of 96 vintage figures (49%). Missing: Yak Face, Blue Snaggletooth, ..."

## Infrastructure

### Production

| Property | Value |
|---|---|
| URL | `https://mcp.houseoffunk.net/mcp` |
| Internal port | `3003` |
| pm2 process name | `mcp-server` |
| Tunnel | Cloudflare Tunnel → `localhost:3003` (no nginx) |
| Deploy command | `npm run build -- --filter=@my-collections/mcp && pm2 restart mcp-server` |

### Staging

| Property | Value |
|---|---|
| URL | `https://stage-mcp.houseoffunk.net/mcp` |
| Internal port | `3002` |
| pm2 process name | `mcp-server-stage` |
| Clone | `~/Sites/my-collections-stage/packages/mcp` |
| Deploy command | `npm run build -- --filter=@my-collections/mcp && pm2 restart mcp-server-stage` |

**Environment variables (`packages/mcp/.env`):**

| Variable | Production | Staging | Description |
|---|---|---|---|
| `PORT` | `3003` | `3002` | Internal listen port |
| `API_BASE_URL` | `https://api.houseoffunk.net` | `https://stage-api.houseoffunk.net` | Which API to call |
| `MCP_BEARER_TOKEN` | *(in LastPass)* | *(in LastPass)* | Static token Claude presents on every request |
| `MCP_REFRESH_TOKEN` | *(written by bootstrap)* | *(written by bootstrap)* | Long-lived refresh token (keep secret) |
| `MCP_OAUTH_CLIENT_ID` | `mcp-server` | `mcp-server` | OAuth client ID registered in the API |

## Registering with Claude

### claude.ai (web and mobile)

1. Go to **Settings → Integrations → MCP Servers**
2. Add server URL: `https://mcp.houseoffunk.net/mcp?token=<MCP_BEARER_TOKEN>`
3. Save — tools become available in new conversations immediately

### Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-collections": {
      "url": "https://mcp.houseoffunk.net/mcp?token=<MCP_BEARER_TOKEN>"
    }
  }
}
```

### Claude Code (this project)

`.mcp.json` at the repo root is committed and points to production:

```json
{
  "mcpServers": {
    "my-collections": {
      "url": "https://mcp.houseoffunk.net/mcp?token=<MCP_BEARER_TOKEN>"
    }
  }
}
```

For local development against a locally running MCP server (`npm run dev` on port 3001), override the URL temporarily — but don't commit the localhost URL.

## Development

**First-time setup (once per machine):**

```bash
cd packages/mcp
npm run bootstrap   # opens browser for PKCE login, saves MCP_REFRESH_TOKEN to .env
```

**Local dev server:**

```bash
npm run dev         # ts-node watch mode on port 3001
```

**Deploy to Mac Mini:**

```bash
npm run build
pm2 restart mcp-server
```
