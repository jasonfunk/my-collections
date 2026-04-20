# My Collections — Agent Use Cases

Reference document covering AI agent concepts, planned agent implementations, billing model, and recommended learning sequence for the My Collections project.

---

## How Agents Work

An agent is an LLM in a loop with tools. The loop:

1. LLM reasons about what to do next
2. LLM calls a tool (search eBay, read DB, write a record, etc.)
3. Tool returns results
4. LLM reasons about what to do next
5. Repeat until task is complete, then return a final response

Three variables determine how capable an agent is:

- **Tools** — what actions it can take
- **Memory** — what context it carries across steps (conversation history, external DB, files)
- **Planning** — can it decompose complex goals, spawn sub-tasks, self-correct?

Claude Code itself is an agent running this loop. Every session is a live example of the pattern.

---

## Planned Agents

### eBay Watcher Pipeline

Monitors eBay for wishlist items and surfaces qualified listings in the app as a "watch list." Implemented as two agents with distinct responsibilities.

#### Agent 1: eBay Scout

| Property | Value |
|---|---|
| Trigger | Scheduled (nightly or weekly cron) |
| Input | Wishlist from API (`GET /collections/*/wishlist`) |
| Output | Raw eBay candidate listings written to staging |

Tools needed:
- HTTP client → call collections API for wishlist items
- eBay Browse API → search by item name and category
- Storage writer → write raw listings to `watch_list_items` table

**eBay Browse API notes:**
- No seller account required; OAuth 2.0 app token only
- Endpoint: `GET https://api.ebay.com/buy/browse/v1/item_summary/search`
- Vintage toy category IDs: Star Wars figures ≈ 246, Transformers ≈ 2364

#### Agent 2: Evaluator

| Property | Value |
|---|---|
| Trigger | Runs after Scout completes (pipeline handoff) |
| Input | Raw listings from Scout + user-defined rules |
| Output | Scored, filtered entries written to `watch_list_items` with status `NEW` |

Tools needed:
- Read staging listings
- Apply rules (price threshold, condition keywords, completeness signals)
- Score each listing 0–100
- Write qualified items to app via API

#### Why Two Agents?

Separation of concerns. The Scout has no knowledge of your rules; the Evaluator has no knowledge of eBay. Each is independently testable. Swapping the Scout (e.g. Mercari instead of eBay) requires no changes to the Evaluator.

#### Data Model Bridge

Existing fields in the domain model that map directly to agent needs:

| Agent Need | Existing Field |
|---|---|
| Wishlist items | `isOwned: false` on user-items; `wishlistPriority` field |
| Item identity | catalog `name`, `externalId`, `line`, `category` |
| Condition grade | `ConditionGrade` enum (C4–C10) |
| Price anchor | `estimatedValue` on catalog; `acquisitionPrice` on user-items |
| Source tracking | `AcquisitionSource.EBAY` already in the enum |

#### Watch List Entity (new — not yet built)

New `watch_list_items` table required to stage eBay candidates:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `userId` | UUID | FK to users |
| `catalogItemId` | UUID | FK to relevant catalog table |
| `collectionType` | CollectionType enum | Disambiguates which catalog |
| `ebayListingUrl` | string | Direct link to listing |
| `ebayListingTitle` | string | Raw title from eBay |
| `ebayPrice` | decimal | Listed price (USD) |
| `conditionKeywords` | string | Raw condition text from listing |
| `agentScore` | integer | 0–100 score from Evaluator |
| `agentNotes` | string | Evaluator's reasoning |
| `status` | enum | `NEW`, `DISMISSED`, `PURCHASED` |
| `discoveredAt` | timestamp | When Scout found it |
| `expiresAt` | timestamp | When listing expires (eBay TTL) |

---

### Photo Cataloger

Identifies a collectible figure from a photo and pre-fills the Add Item form in the app.

#### Two Entry Points, One Agent

The identification logic is identical in both cases. The delivery mechanism differs.

```
packages/api/src/agents/photo-cataloger.ts   ← shared core logic
         ↑                        ↑
    CLI script               NestJS endpoint
(Claude Code session)      (in-app feature)
```

#### Entry Point 1: Bulk Population via Claude Code (Pro Plan)

Used for initial collection population. Photos of figures are shared directly in a Claude Code session. Claude analyzes each photo, identifies the figure, finds the matching catalog entry, and calls the API to create the user-item record.

**No additional cost** — this runs against the existing Claude Pro plan.

> **Note:** Images cost more tokens than text. A typical photo runs 1,000–2,000 tokens. A large collection session will burn through usage faster than a text-heavy session, but it remains covered by the plan.

#### Entry Point 2: In-App Photo Upload (API Billing)

Used for ongoing one-off identification. User taps "Identify this figure" in the web or mobile app → app sends the photo to the NestJS backend → backend calls the Anthropic API → Claude identifies it → response pre-fills the Add Item form.

**Billed per call** against the Anthropic API (separate from Pro plan).

Estimated cost per photo: **$0.02–$0.08** depending on image resolution and model choice.

---

## Other Agent Ideas

| Agent | What It Does | Interesting Because |
|---|---|---|
| **Deal Scorer** | Paste an eBay URL; agent scores it against your rules and tells you whether to buy | Single-shot, great first learning exercise |
| **Set Completion Advisor** | "You own 40 of 45 ESB figures — here are the 5 missing and their current prices" | Requires reasoning about catalog completeness, not just ownership |
| **Price Trend Tracker** | Weekly poll of eBay/Worthpoint; updates `estimatedValue` on owned items | Passive wealth tracking, fully autonomous |
| **Variant Spotter** | Detects if a listing is a catalog variant you don't already own | Uses vision; requires cross-referencing listing photos against variant data |
| **Weekly Digest** | Sunday summary: new watch items, price moves, "you could complete set X for $Y this week" | Scheduling + multi-source aggregation |
| **Provenance Researcher** | Given a catalog item, finds production history, known variants, notable auction sales | Pure research agent, no writes needed |

---

## Billing Model

| Use Case | Runs Against | Cost Model |
|---|---|---|
| Claude Code sessions (bulk population, one-off tasks) | Claude Pro plan | Included in subscription |
| Custom SDK agents (eBay Scout, Evaluator, in-app Photo Cataloger) | Anthropic API | Pay-per-token, separate bill |

Custom agents require an Anthropic API key from console.anthropic.com. This is entirely separate from the claude.ai login and subscription.

### eBay Pipeline Cost Estimate

Based on a 30-item wishlist, with prompt caching and pre-filtering applied:

| Component | Tokens (approx) | Cost (approx) |
|---|---|---|
| System prompt + rules (cached reads) | 5,000 | $0.002 |
| eBay search results (uncached) | 60,000 | $0.18 |
| Agent output / reasoning | 5,000 | $0.075 |
| **Per run total** | | **~$0.05–$0.25** |

| Schedule | Monthly cost |
|---|---|
| Weekly | ~$1 |
| Daily | ~$7.50 |

### Cost Levers

1. **Prompt caching** — static system prompt, rules, and tool definitions cost 90% less on cache reads
2. **Pre-filter before LLM** — code-level price/keyword filter reduces eBay token volume by ~70%
3. **Right model per agent** — Scout (simple summarization) → Haiku (~8× cheaper than Sonnet); Evaluator (reasoning) → Sonnet or Opus
4. **Summarize between agents** — Scout produces a compact structured summary before handoff; Evaluator never sees raw eBay JSON

---

## Implementation Approaches

### Option A: Standalone Node.js + Anthropic SDK (Learning Path)

Script in `packages/api/src/agents/` or a new `packages/agent/` workspace:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const tools = [
  { name: 'get_wishlist', ... },    // calls collections API
  { name: 'search_ebay', ... },     // calls eBay Browse API
  { name: 'save_watch_item', ... }, // POSTs to collections API
];

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  tools,
  messages: [{ role: 'user', content: 'Search eBay for my wishlist items...' }],
});
// Handle tool_use → execute tool → append tool_result → loop until stop_reason === 'end_turn'
```

Raw pattern — most educational, full control over the loop.

### Option B: Claude Code RemoteTrigger + CronCreate (No-Code Scheduling)

Use Claude Code's built-in scheduling to run an agent prompt on a cron schedule. No SDK required — Claude Code is the agent. Good for rapid experiments before committing to the full SDK implementation.

### Option C: NestJS Background Job (Production Path)

Add BullMQ to the API. A scheduled job enqueues the agent run; a worker calls the Anthropic SDK and writes results to the DB. Integrates cleanly with existing NestJS architecture and TypeORM.

**Recommended sequence:** Learn with Option A → experiment with Option B → productionize with Option C.

---

## Recommended Learning Sequence

1. Read Anthropic SDK tool use documentation (use Context7 MCP to pull live docs)
2. Build the **Deal Scorer** as a CLI script (Option A) — ~150 lines of TypeScript, single-shot, immediately useful
3. Extend to the **eBay Scout** — adds scheduling and multi-step tool calls
4. Add the **Evaluator** — adds scoring logic, rules, and DB writes
5. Build the **Photo Cataloger** CLI entry point (bulk population use case)
6. Add the NestJS endpoint for the in-app Photo Cataloger (Option C)
7. Productionize the eBay pipeline with BullMQ (Option C)

The Deal Scorer is the recommended entry point because it is single-shot (no scheduling complexity), teaches the core SDK loop, and is immediately useful as a standalone tool.
