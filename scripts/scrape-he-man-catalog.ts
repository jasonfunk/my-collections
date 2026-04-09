/**
 * One-time scraper for the Masters of the Universe (He-Man) Original Series catalog.
 * Source: https://www.transformerland.com/wiki/masters-of-the-universe-motu/the-original-series/
 *
 * Run: npm run scrape:he-man
 * Output: packages/api/src/database/seeds/data/he-man-catalog.json
 *
 * Requires: npx playwright install chromium  (one-time setup)
 * NOTE: headless:false required — site uses Cloudflare managed challenge.
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { chromium, Browser, Page } from 'playwright';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = 'https://www.transformerland.com';
const INDEX_URL = `${BASE_URL}/wiki/masters-of-the-universe-motu/the-original-series/`;
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/he-man-catalog.json',
);
const RATE_LIMIT_MS = 1100; // ~1 req/sec, polite scraping

// ---------------------------------------------------------------------------
// Character type mapping: URL slug segment → MastersCharacterType enum value
// null = not a character (vehicle, playset, accessory, etc.)
// ---------------------------------------------------------------------------

const CHARACTER_TYPE_SLUG_MAP: Record<string, string | null> = {
  'heroic-warriors': 'HEROIC',
  'evil-warriors': 'EVIL',
  'heroic-allies': 'HEROIC_ALLY',
  'heroic-beasts': 'HEROIC_ALLY',
  'evil-allies': 'EVIL_ALLY',
  'evil-beasts': 'EVIL_ALLY',
  'neutral-characters': 'NEUTRAL',
  vehicles: null,
  beasts: null,
  playsets: null,
  accessories: null,
  roleplay: null,
  'role-play': null,
  weapons: null,
  'mini-figures': null,
};

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

interface CatalogEntry {
  externalId: string;
  name: string;
  line: 'ORIGINAL';
  characterType: string | null;
  releaseYear: number | null;
  accessories: string[];
  isVariant: boolean;
  variantDescription: null;
  catalogImageUrl: string | null;
  sourceUrl: string;
  miniComic: string | null;
  hasArmorOrFeature: boolean;
  featureDescription: string | null;
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

/**
 * Derive characterType from the item detail URL.
 * URL pattern: /wiki/toy-info/masters-of-the-universe-motu-the-original-series-{slug}-{item}/{id}/
 * Returns null for non-character items (vehicles, playsets, etc.).
 */
function extractCharacterTypeFromUrl(url: string): string | null {
  for (const [slug, characterType] of Object.entries(CHARACTER_TYPE_SLUG_MAP)) {
    if (
      url.includes(`-the-original-series-${slug}-`) ||
      url.includes(`-the-original-series-${slug}/`)
    ) {
      return characterType;
    }
  }
  console.warn(`  Could not determine characterType from URL: ${url}`);
  return null;
}

/** Extract the item's numeric ID from the URL (trailing /{id}/ segment). */
function extractExternalId(url: string): string {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? match[1] : '';
}

/**
 * Extract item name from the breadcrumb's trailing segment.
 * Breadcrumb: Home > Collector's Guides > Masters of the Universe > The Original Series > Heroic Warriors > He-Man
 */
function extractName($: cheerio.CheerioAPI): string {
  let name = '';

  $('*').each((_, el) => {
    const $el = $(el);
    if ($el.find('a').length < 3 || $el.find('a').length > 10) return;
    const text = $el.text().trim();
    // Breadcrumb will contain either "The Original Series" or "Masters of the Universe"
    if (!text.includes('The Original Series') && !text.includes('Masters of the Universe')) return;

    const parts = text.split('>');
    const lastPart = parts[parts.length - 1]?.trim();
    if (lastPart && lastPart.length > 0 && lastPart.length < 100) {
      name = lastPart;
      return false; // break
    }
  });

  if (name) return name;

  // Fallback: h1 heading — strip prefix up to last colon
  const h1 = $('h1').first().text().trim();
  if (h1) {
    const colonIdx = h1.lastIndexOf(':');
    if (colonIdx !== -1) return h1.slice(colonIdx + 1).trim();
    return h1;
  }

  return 'Unknown';
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
 * Same selector/parse logic as the Star Wars scraper — site structure is identical.
 */
function extractAccessories($: cheerio.CheerioAPI): string[] {
  const accessories: string[] = [];

  $('p').each((_, pEl) => {
    if ($(pEl).text().trim() !== 'Set Accessories') return;

    const container = $(pEl).next();
    container.children().each((_, child) => {
      const $child = $(child);

      const labelEl = $child.find('div, span').filter((_, d) => {
        const t = $(d).text().trim();
        return (
          t.length > 0 &&
          !t.startsWith('Size:') &&
          !t.startsWith('Sold') &&
          !t.startsWith('$') &&
          !t.startsWith('Complete') &&
          !t.startsWith('Fig Only')
        );
      }).first();

      let label = labelEl.text().trim();

      if (!label) {
        label = $child.clone().children('img').remove().end().text().trim();
      }

      // Strip trailing "(xN)" quantity
      label = label.replace(/\s*\(\s*x\d+\s*\)\s*$/, '').trim();

      if (label && label.length > 0 && !label.startsWith('Size:')) {
        accessories.push(label);
      }
    });

    return false;
  });

  return accessories;
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
 * Extract mini-comic title from the info table "Mini-Comic:" row.
 * Returns null if absent.
 */
function extractMiniComic($: cheerio.CheerioAPI): string | null {
  let result: string | null = null;
  $('tr').each((_, row) => {
    const header = $(row).find('th').text().trim();
    if (header === 'Mini-Comic:' || header === 'Mini Comic:') {
      const value = $(row).find('td').text().trim();
      if (value && value !== '(none)' && value !== 'None') result = value;
      return false;
    }
  });
  return result;
}

/**
 * Detect armor/action feature from the info table "Features:" or "Action Feature:" row.
 * Returns { hasArmorOrFeature, featureDescription }.
 */
function extractFeature($: cheerio.CheerioAPI): { hasArmorOrFeature: boolean; featureDescription: string | null } {
  let featureDescription: string | null = null;

  $('tr').each((_, row) => {
    const header = $(row).find('th').text().trim();
    if (header === 'Features:' || header === 'Action Feature:' || header === 'Feature:') {
      const value = $(row).find('td').text().trim();
      if (value && value !== '(none)' && value !== 'None') {
        featureDescription = value;
      }
      return false;
    }
  });

  return {
    hasArmorOrFeature: featureDescription !== null,
    featureDescription,
  };
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

  // Collect all links to MOTU original-series item detail pages
  $('a[href*="/wiki/toy-info/masters-of-the-universe-motu-the-original-series-"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    if (!seen.has(fullUrl)) {
      seen.add(fullUrl);
      itemUrls.push(fullUrl);
    }
  });

  // Log unique category slugs found, so any missing/unexpected slugs are visible
  const slugsFound = new Set<string>();
  for (const url of itemUrls) {
    const match = url.match(/-the-original-series-([a-z-]+)-[a-z]/);
    if (match) slugsFound.add(match[1]);
  }
  console.log(`Category slugs found on index: ${[...slugsFound].join(', ')}`);
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
  const characterType = extractCharacterTypeFromUrl(url);
  const name = extractName($);
  const catalogImageUrl = extractCatalogImage($);
  const accessories = extractAccessories($);
  const releaseYear = extractYear($);
  const miniComic = extractMiniComic($);
  const { hasArmorOrFeature, featureDescription } = extractFeature($);

  return {
    externalId,
    name,
    line: 'ORIGINAL',
    characterType,
    releaseYear,
    accessories,
    isVariant: false,
    variantDescription: null,
    catalogImageUrl,
    sourceUrl: url,
    miniComic,
    hasArmorOrFeature,
    featureDescription,
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
        console.log(`${progress} ${entry.name} (${entry.characterType ?? 'non-character'})`);
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
