/**
 * Enriches g1-transformers-catalog.json with altMode and size.
 *
 * Phase 1 — size: derived locally from the sourceUrl slug (no network).
 * Phase 2 — altMode: TFWiki wikitext fetched, then Claude Haiku extracts the alt mode.
 *
 * Run: npm run enrich:transformers-tfw
 * Output: packages/api/src/database/seeds/data/g1-transformers-catalog.json (in-place)
 *
 * Requires: ANTHROPIC_API_KEY in environment (or .env at repo root).
 *
 * Re-run safe: records already having both altMode and size are skipped.
 * Skipped entirely: Action Masters (non-transforming), Decoys (rubber figures).
 *
 * TFWiki lookup order:
 *   1. "{name} (G1)/toys" sub-page
 *   2. "{name} (G1)" main page, ==Toys== section
 *   3. Full-text search "{name} G1 toy", top result
 *
 * TFWiki API notes:
 *   - Requires browser-like User-Agent (Squid proxy blocks bot UAs)
 *   - Legacy MediaWiki format: pages dict keyed by pageid, content at revisions[0]['*']
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../packages/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TFWIKI_API = 'https://tfwiki.net/mediawiki/api.php';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const TFWIKI_RATE_MS = 600;
const CLAUDE_RATE_MS = 300;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DATA_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/g1-transformers-catalog.json',
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CatalogEntry {
  externalId: string | null;
  name: string;
  faction: string | null;
  line: string | null;
  altMode: string | null;
  size?: string | null;
  accessories: string[];
  releaseYear: number | null;
  isVariant: boolean;
  variantDescription: string | null;
  catalogImageUrl: string | null;
  sourceUrl: string | null;
  isCombiner: boolean;
  combinerTeam: string | null;
  isGiftSet: boolean;
  isMailaway: boolean;
  japaneseRelease: boolean;
}

// ---------------------------------------------------------------------------
// Phase 1 — size from sourceUrl slug
// ---------------------------------------------------------------------------

const GESTALT_SLUG =
  /-(superion|bruticus|devastator|menasor|defensor|computron|predaking|abominus|piranacon|monstructor)$/i;

function sizeFromUrl(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  const m = sourceUrl.match(/\/transformers-g1-([^/]+)\/\d/);
  if (!m) return null;
  const slug = m[1];

  if (slug.startsWith('decoys-')) return 'MINI';
  if (slug.startsWith('mini-cassettes-')) return 'MINI';
  if (slug.startsWith('mini-spies-')) return 'MINI';
  if (slug.startsWith('legends-')) return 'MINI';
  if (slug.startsWith('micromasters-')) return 'MINI';

  if (slug.startsWith('mini-vehicles-')) return 'SMALL';
  if (slug.startsWith('jumpstarters-')) return 'SMALL';
  if (slug.startsWith('throttlebots-')) return 'SMALL';
  if (slug.startsWith('sparkabots-and-firecons-')) return 'SMALL';
  if (slug.startsWith('triggerbots-and-triggercons-')) return 'SMALL';
  if (slug.startsWith('battlechargers-')) return 'SMALL';
  if (slug.startsWith('clones-')) return 'SMALL';
  if (slug.startsWith('duocons-')) return 'SMALL';
  if (slug.startsWith('powerdashers-')) return 'SMALL';

  if (slug.startsWith('combiners-')) {
    if (GESTALT_SLUG.test(slug)) return 'JUMBO';
    if (slug.startsWith('combiners-constructicons-')) return 'MEDIUM';
    return 'SMALL';
  }

  if (slug.startsWith('autobot-cars-')) return 'MEDIUM';
  if (slug.startsWith('insecticons-')) return 'MEDIUM';
  if (slug.startsWith('omnibots-')) return 'MEDIUM';

  if (slug.startsWith('decepticon-jets-')) return 'LARGE';
  if (slug.startsWith('dinobots-')) return 'LARGE';
  if (slug.startsWith('headmasters-')) return 'LARGE';
  if (slug.startsWith('targetmasters-')) return 'LARGE';
  if (slug.startsWith('powermasters-')) return 'LARGE';
  if (slug.startsWith('pretenders-')) return 'LARGE';
  if (slug.startsWith('leaders-')) return 'LARGE';
  if (slug.startsWith('triple-changers-')) return 'LARGE';
  if (slug.startsWith('six-changers-')) return 'LARGE';
  if (slug.startsWith('communicators-')) return 'LARGE';
  if (slug.startsWith('monsterbots-')) return 'LARGE';
  if (slug.startsWith('deluxe-vehicles-')) return 'LARGE';

  if (slug.startsWith('bases-')) return 'JUMBO';

  if (slug.startsWith('action-masters-')) return null;

  if (slug === 'other-sky-lynx') return 'JUMBO';
  if (slug === 'other-ultra-magnus') return 'JUMBO';
  if (slug === 'other-jetfire') return 'LARGE';
  if (slug === 'other-shockwave') return 'LARGE';
  if (slug === 'other-wreck-gar') return 'LARGE';
  if (slug === 'other-perceptor') return 'MEDIUM';
  if (slug === 'other-punch-counterpunch') return 'MEDIUM';
  if (slug === 'other-gnaw') return 'SMALL';
  if (slug.startsWith('other-mail-away-exclusive-reflector')) return 'SMALL';

  return null;
}

// ---------------------------------------------------------------------------
// Phase 2 — TFWiki fetch
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiGet(params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams({ format: 'json', ...params }).toString();
  const res = await fetch(`${TFWIKI_API}?${qs}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`TFWiki HTTP ${res.status}`);
  return res.json();
}

interface LegacyWikiResponse {
  query?: {
    pages?: Record<string, {
      pageid: number;
      missing?: string;
      revisions?: Array<{ '*': string }>;
    }>;
    search?: Array<{ title: string }>;
  };
}

async function fetchWikitext(title: string): Promise<string | null> {
  const data = (await apiGet({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    titles: title,
    redirects: '1',
  })) as LegacyWikiResponse;

  const pages = data?.query?.pages;
  if (!pages) return null;
  for (const page of Object.values(pages)) {
    if ('missing' in page) return null;
    const content = page.revisions?.[0]?.['*'];
    if (content && !content.startsWith('#REDIRECT')) return content;
  }
  return null;
}

async function searchTopTitle(name: string): Promise<string | null> {
  const data = (await apiGet({
    action: 'query',
    list: 'search',
    srsearch: `${name} G1 toy`,
    srlimit: '1',
    srnamespace: '0',
  })) as LegacyWikiResponse;
  return data?.query?.search?.[0]?.title ?? null;
}

async function resolveWikitext(name: string): Promise<{ text: string; via: string } | null> {
  let wt = await fetchWikitext(`${name} (G1)/toys`);
  if (wt) return { text: wt, via: '/toys' };

  await sleep(TFWIKI_RATE_MS);

  wt = await fetchWikitext(`${name} (G1)`);
  if (wt) {
    const toyIdx = wt.indexOf('==Toys==');
    if (toyIdx >= 0) {
      const after = wt.slice(toyIdx + 8);
      const nextSection = after.search(/^==(?!=)/m);
      const toySection = nextSection >= 0 ? after.slice(0, nextSection) : after.slice(0, 3000);
      if (toySection.includes('{{Bp-')) return { text: toySection, via: 'main/toys-section' };
    }
  }

  await sleep(TFWIKI_RATE_MS);

  const topTitle = await searchTopTitle(name);
  if (topTitle) {
    await sleep(TFWIKI_RATE_MS);
    const searchWt = await fetchWikitext(topTitle);
    if (searchWt) {
      const toyIdx = searchWt.indexOf('==Toys==');
      const section = toyIdx >= 0
        ? searchWt.slice(toyIdx, toyIdx + 3000)
        : searchWt.slice(0, 3000);
      return { text: section, via: `search→${topTitle}` };
    }
  }

  return null;
}

function extractToyProse(wikitext: string): string {
  const bpMatch = wikitext.match(/\{\{Bp-[a-z0-9]+\|([^}]+)\}\}/i);
  if (!bpMatch || bpMatch.index == null) return '';
  const afterBp = wikitext.slice(bpMatch.index + bpMatch[0].length);
  const proseMatch = afterBp.match(/(?:^|\n):[ ]?([A-Z][^\n]+(?:\n:[ ]?[A-Z][^\n]+)*)/);
  return proseMatch ? proseMatch[1] : '';
}

// ---------------------------------------------------------------------------
// Phase 2 — Claude alt mode extraction
// ---------------------------------------------------------------------------

async function extractAltModeViaClaude(
  name: string,
  prose: string,
  isCassette: boolean,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const cassetteNote = isCassette
    ? '\nThis is a cassette-type Transformer. Give the non-cassette alt mode — the animal, creature, or robot form it transforms into — NOT "microcassette" or "cassette".'
    : '';

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 25,
      system:
        'You extract alt modes from G1 Transformers toy descriptions. ' +
        'Reply with ONLY the alt mode name (1–5 words, no punctuation except hyphens). ' +
        'Reply "null" if the alt mode cannot be determined from the text.',
      messages: [{
        role: 'user',
        content: `Character: ${name}${cassetteNote}\n\nTFWiki description:\n${prose.slice(0, 800)}`,
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content?.[0]?.text?.trim();
  if (!text || text.toLowerCase() === 'null') return null;
  return text;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const records: CatalogEntry[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  // --- Phase 1: size from sourceUrl slug ---
  let sizeSet = 0;
  let sizeAlreadyDone = 0;
  for (const record of records) {
    record.size = record.size ?? null;
    if (record.size != null) { sizeAlreadyDone++; continue; }
    const derived = sizeFromUrl(record.sourceUrl);
    if (derived !== null) { record.size = derived; sizeSet++; }
  }
  console.log(`Phase 1 complete: ${sizeSet} sizes derived, ${sizeAlreadyDone} already set.\n`);

  // --- Phase 2: altMode via TFWiki + Claude ---
  let enriched = 0;
  let alreadyDone = 0;
  let noMatch = 0;
  let claudeNull = 0;
  const noMatchNames: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const progress = `[${i + 1}/${records.length}]`;

    if (record.altMode != null) {
      console.log(`${progress} ${record.name} — skip (already set: "${record.altMode}")`);
      alreadyDone++;
      continue;
    }

    const slug = record.sourceUrl?.match(/\/transformers-g1-([^/]+)\/\d/)?.[1] ?? '';

    if (slug.startsWith('action-masters-') || slug.startsWith('decoys-')) {
      console.log(`${progress} ${record.name} — skip (${slug.startsWith('action-masters-') ? 'Action Master' : 'decoy'})`);
      alreadyDone++;
      continue;
    }

    const result = await resolveWikitext(record.name);
    await sleep(TFWIKI_RATE_MS);

    if (!result) {
      console.log(`${progress} ${record.name} — no TFWiki match`);
      noMatch++;
      noMatchNames.push(record.name);
      continue;
    }

    const prose = extractToyProse(result.text);
    if (!prose) {
      console.log(`${progress} ${record.name} [${result.via}] — no prose extracted`);
      noMatch++;
      noMatchNames.push(record.name);
      continue;
    }

    const isCassette = slug.startsWith('mini-cassettes-');
    const altMode = await extractAltModeViaClaude(record.name, prose, isCassette);
    await sleep(CLAUDE_RATE_MS);

    record.altMode = altMode;

    if (altMode != null) {
      console.log(`${progress} ${record.name} [${result.via}] → "${altMode}"`);
      enriched++;
    } else {
      console.log(`${progress} ${record.name} [${result.via}] → null (Claude couldn't determine)`);
      claudeNull++;
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2), 'utf8');

  console.log('\n--- Summary ---');
  console.log(`Phase 1 sizes set: ${sizeSet}`);
  console.log(`Phase 2 enriched: ${enriched}  |  Already done: ${alreadyDone}  |  No TFWiki match: ${noMatch}  |  Claude null: ${claudeNull}`);
  if (noMatchNames.length > 0) {
    console.log('\nNo TFWiki match for:');
    noMatchNames.forEach((n) => console.log(`  ${n}`));
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
