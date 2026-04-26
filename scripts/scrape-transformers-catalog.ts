/**
 * One-time scraper for the G1 Transformers catalog.
 * Source: https://www.transformerland.com/wiki/transformers/g1/
 *
 * Run: npm run scrape:transformers
 * Output: packages/api/src/database/seeds/data/g1-transformers-catalog.json
 *
 * Requires: npx playwright install chromium  (one-time setup)
 * NOTE: headless:false required — site uses Cloudflare managed challenge.
 *
 * Explored via Playwright MCP before writing:
 *  - Link selector: a[href*="/wiki/toy-info/transformers-g1-"]
 *  - Info table rows: Toy Line, Series, Subgroup, Alliance (faction), Year, ID
 *  - Name: H1 is "G1 {Subgroup}: {Name}" — extract after lastIndexOf(':')
 *  - Combiner: Subgroup row = "Combiners"; team = subgroup text from H1
 *  - Accessories: same "Set Accessories" structure as He-Man/Star Wars scrapers
 *  - Image: first reference_images link in aside/sidebar
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { chromium, Browser, Page } from 'playwright';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = 'https://www.transformerland.com';
const INDEX_URL = `${BASE_URL}/wiki/transformers/g1/`;
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/g1-transformers-catalog.json',
);
const RATE_LIMIT_MS = 1100; // ~1 req/sec, polite scraping

// ---------------------------------------------------------------------------
// Year → Line mapping
// ---------------------------------------------------------------------------

function yearToLine(year: number | null): string | null {
  if (year === null) return null;
  if (year <= 1984) return 'G1_S1';
  if (year === 1985) return 'G1_S2';
  if (year === 1986) return 'G1_S3';
  if (year === 1987) return 'G1_S4';
  if (year === 1988) return 'G1_S5';
  if (year >= 1989) return 'G1_S6';
  return null;
}

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

interface CatalogEntry {
  externalId: string;
  name: string;
  faction: 'AUTOBOT' | 'DECEPTICON' | null;
  line: string | null;
  altMode: null;           // not in site info table; left for manual enrichment
  accessories: string[];
  releaseYear: number | null;
  isVariant: boolean;
  variantDescription: null;
  catalogImageUrl: string | null;
  sourceUrl: string;
  isCombiner: boolean;
  combinerTeam: string | null;
  isGiftSet: boolean;
  isMailaway: boolean;
  japaneseRelease: boolean;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(page: Page, url: string): Promise<string> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  // Wait for Cloudflare challenge to resolve (title changes from "Just a moment...")
  try {
    await page.waitForFunction(
      () => !document.title.includes('Just a moment'),
      { timeout: 15_000 },
    );
  } catch {
    const title = await page.title();
    if (title.includes('Just a moment')) {
      throw new Error(`Cloudflare challenge did not resolve for: ${url}`);
    }
  }
  return page.content();
}

/** Extract the item's numeric ID from the URL (trailing /{id}/ segment). */
function extractExternalId(url: string): string {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? match[1] : '';
}

/**
 * Extract name and subgroup from the H1.
 * H1 format: "G1 {Subgroup}: {Name}"
 * e.g., "G1 Autobot Cars: Bluestreak" → name="Bluestreak", subgroup="Autobot Cars"
 * e.g., "G1 Aerialbots (Superion, G1): Air Raid" → name="Air Raid", subgroup="Aerialbots (Superion, G1)"
 */
function extractNameAndSubgroup($: cheerio.CheerioAPI): { name: string; subgroup: string } {
  const h1 = $('h1').first().text().trim();
  // Remove leading "G1 " prefix
  // H1 renders as two text nodes: "G1" + " SubgroupName: ItemName" (with or without space)
  const withoutG1 = h1.replace(/^G1\s*/, '');
  const colonIdx = withoutG1.lastIndexOf(':');
  if (colonIdx !== -1) {
    return {
      subgroup: withoutG1.slice(0, colonIdx).trim(),
      name: withoutG1.slice(colonIdx + 1).trim(),
    };
  }
  return { subgroup: '', name: h1 };
}

/**
 * Extract faction from the "Alliance:" row in the info table.
 * Returns "AUTOBOT", "DECEPTICON", or null.
 */
function extractFaction($: cheerio.CheerioAPI): 'AUTOBOT' | 'DECEPTICON' | null {
  let result: 'AUTOBOT' | 'DECEPTICON' | null = null;
  $('tr').each((_, row) => {
    const header = $(row).find('th').text().trim();
    if (header === 'Alliance:') {
      const value = $(row).find('td').text().trim();
      if (value === 'Autobot') result = 'AUTOBOT';
      else if (value === 'Decepticon') result = 'DECEPTICON';
      return false; // break
    }
  });
  return result;
}

/**
 * Extract the "Subgroup:" row value from the info table.
 * Used to determine if the item is a combiner.
 */
function extractSubgroupRow($: cheerio.CheerioAPI): string {
  let result = '';
  $('tr').each((_, row) => {
    const header = $(row).find('th').text().trim();
    if (header === 'Subgroup:') {
      result = $(row).find('td').text().trim();
      return false;
    }
  });
  return result;
}

/** Extract production year from the "Year:" row in the info table. */
function extractYear($: cheerio.CheerioAPI): number | null {
  let result: number | null = null;
  $('tr').each((_, row) => {
    const header = $(row).find('th').text().trim();
    if (header === 'Year:') {
      const value = $(row).find('td').text().trim();
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed > 1970 && parsed < 2005) result = parsed;
      return false;
    }
  });
  return result;
}

/**
 * Extract catalog image URL from the sidebar/aside area.
 * First reference_images link in the sidebar is the main figure image.
 */
function extractCatalogImage($: cheerio.CheerioAPI): string | null {
  const aside = $('aside, [role="complementary"]').first();
  if (aside.length) {
    const href = aside.find('a[href*="/image/reference_images/"]').first().attr('href');
    if (href) return href.startsWith('http') ? href : `${BASE_URL}${href}`;
  }

  const href = $('a[href*="/image/reference_images/"]').first().attr('href');
  if (href) return href.startsWith('http') ? href : `${BASE_URL}${href}`;

  return null;
}

/**
 * Extract accessories from the "Set Accessories" section.
 * Handles two DOM structures used across the site:
 *   Wrapper: a single container div whose children are individual accessory entries
 *   Flat: each accessory entry is a direct sibling of the <p> heading
 */
function extractAccessories($: cheerio.CheerioAPI): string[] {
  const accessories: string[] = [];

  $('p').each((_, pEl) => {
    if ($(pEl).text().trim() !== 'Set Accessories') return;

    // Collect ALL siblings until the next section heading <p>
    const items = $(pEl).nextUntil('p');

    // Detect structure:
    //   Wrapper: single div whose children are the individual accessory entries
    //   Flat: each sibling IS one accessory entry (has a direct ref-image link)
    const firstHasDirectImage =
      items.length > 0 &&
      items.first().children('a[href*="/image/reference_images/"]').length > 0;
    const isWrapper = !firstHasDirectImage && items.length === 1;

    const processItem = ($el: ReturnType<typeof $>) => {
      const labelEl = $el.find('div, span').filter((_, d) => {
        const t = $(d).text().trim();
        return (
          t.length > 0 &&
          !t.startsWith('Size:') &&
          !t.startsWith('Sold') &&
          !t.startsWith('$') &&
          !t.startsWith('Complete') &&
          !t.startsWith('Fig Only') &&
          !t.startsWith('In Stock') &&
          !t.startsWith('In stock') &&
          !t.startsWith('Buy It') &&
          !t.startsWith('Buy it') &&
          !t.startsWith('Out of Stock') &&
          !t.startsWith('Pre-Order')
        );
      }).first();

      let label = labelEl.text().trim();
      if (!label) {
        label = $el.clone().children('img').remove().end().text().trim();
      }

      // Strip trailing "(xN)" quantity
      label = label.replace(/\s*\(\s*x\d+\s*\)\s*$/, '').trim();

      if (
        label &&
        label.length > 0 &&
        !label.startsWith('Size:') &&
        !label.startsWith('In Stock') &&
        !label.startsWith('In stock') &&
        !label.startsWith('Sold') &&
        !label.startsWith('Buy')
      ) {
        accessories.push(label);
      }
    };

    if (isWrapper) {
      items.first().children().each((_, child) => processItem($(child)));
    } else {
      items.each((_, item) => processItem($(item)));
    }

    return false; // stop after first "Set Accessories" section
  });

  return accessories;
}

// ---------------------------------------------------------------------------
// Index page scraping
// ---------------------------------------------------------------------------

async function scrapeIndexPage(page: Page): Promise<string[]> {
  console.log(`Fetching index page: ${INDEX_URL}`);
  const html = await fetchHtml(page, INDEX_URL);
  const $ = cheerio.load(html);

  const itemUrls: string[] = [];
  const seen = new Set<string>();

  // All G1 item detail pages — confirmed URL pattern via Playwright exploration
  $('a[href*="/wiki/toy-info/transformers-g1-"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    if (!seen.has(fullUrl)) {
      seen.add(fullUrl);
      itemUrls.push(fullUrl);
    }
  });

  console.log(`Found ${itemUrls.length} items on index page.`);
  return itemUrls;
}

// ---------------------------------------------------------------------------
// Detail page scraping
// ---------------------------------------------------------------------------

async function scrapeDetailPage(page: Page, url: string): Promise<CatalogEntry> {
  const html = await fetchHtml(page, url);
  const $ = cheerio.load(html);

  const externalId = extractExternalId(url);
  const { name, subgroup: h1Subgroup } = extractNameAndSubgroup($);
  const faction = extractFaction($);
  const subgroupRow = extractSubgroupRow($);
  const releaseYear = extractYear($);
  const catalogImageUrl = extractCatalogImage($);
  const accessories = extractAccessories($);

  const line = yearToLine(releaseYear);

  // Combiner: Subgroup info table row = "Combiners"
  const isCombiner = subgroupRow === 'Combiners';
  // Team name comes from the H1 subgroup, which is the team label (e.g., "Aerialbots (Superion, G1)")
  const combinerTeam = isCombiner ? h1Subgroup : null;

  // Mail-away items have "mail-away" in their URL slug
  const isMailaway = url.includes('mail-away');

  return {
    externalId,
    name,
    faction,
    line,
    altMode: null,
    accessories,
    releaseYear,
    isVariant: false,
    variantDescription: null,
    catalogImageUrl,
    sourceUrl: url,
    isCombiner,
    combinerTeam,
    isGiftSet: false,
    isMailaway,
    japaneseRelease: false,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  let browser: Browser | null = null;

  try {
    // headless: false required — the site uses Cloudflare managed challenge
    // which requires real JS execution in a non-headless Chrome context.
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    const itemUrls = await scrapeIndexPage(page);
    const total = itemUrls.length;
    const results: CatalogEntry[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (let i = 0; i < total; i++) {
      const url = itemUrls[i];
      const progress = `[${i + 1}/${total}]`;

      try {
        const entry = await scrapeDetailPage(page, url);
        results.push(entry);
        console.log(`${progress} ${entry.name} (${entry.faction ?? 'unknown'}, ${entry.line ?? 'no year'}${entry.isCombiner ? `, combiner: ${entry.combinerTeam}` : ''})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${progress} ERROR ${url} — ${message}`);
        errors.push({ url, error: message });
      }

      if (i < total - 1) {
        await sleep(RATE_LIMIT_MS);
      }
    }

    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');

    console.log(`\nDone. ${results.length} items written to ${OUTPUT_PATH}`);
    if (errors.length > 0) {
      console.warn(`${errors.length} items failed:`);
      for (const { url, error } of errors) {
        console.warn(`  ${url} — ${error}`);
      }
    }
  } finally {
    await browser?.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
