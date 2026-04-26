/**
 * COL-65: One-time scraper for the Star Wars Original Kenner Series catalog.
 * Source: https://www.transformerland.com/wiki/star-wars/original-kenner-series/
 *
 * Run: npm run scrape:star-wars
 * Output: packages/api/src/database/seeds/data/star-wars-catalog.json
 *
 * Requires: npx playwright install chromium  (one-time setup)
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { chromium, Browser, Page } from 'playwright';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = 'https://www.transformerland.com';
const INDEX_URL = `${BASE_URL}/wiki/star-wars/original-kenner-series/`;
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/star-wars-catalog.json',
);
const RATE_LIMIT_MS = 1100; // ~1 req/sec, polite scraping

// ---------------------------------------------------------------------------
// Category mapping: URL slug segment → StarWarsCategory enum value
// ---------------------------------------------------------------------------

const CATEGORY_SLUG_MAP: Record<string, string> = {
  '12-inch-action-figures': 'TWELVE_INCH',
  accessories: 'ACCESSORY',
  'basic-figures': 'BASIC_FIGURE',
  'collectors-cases': 'COLLECTOR_CASE',
  creatures: 'CREATURE',
  'mini-rigs': 'MINI_RIG',
  playsets: 'PLAYSET',
  roleplay: 'ROLEPLAY',
  'small-scale-die-cast': 'DIE_CAST',
  vehicles: 'VEHICLE',
};

// figureSize derived from category — site's size field is unreliable
const FIGURE_SIZE_BY_CATEGORY: Record<string, string> = {
  BASIC_FIGURE: '3.75',
  TWELVE_INCH: '12',
};

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

interface CatalogEntry {
  externalId: string;
  name: string;
  category: string;
  line: null;
  figureSize: string | null;
  accessories: string[];
  isVariant: boolean;
  variantDescription: null;
  catalogImageUrl: string | null;
  sourceUrl: string;
  kennerItemNumber: string | null;
  year: number | null;
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
    // If still on challenge page after timeout, throw so the item is logged as an error
    const title = await page.title();
    if (title.includes('Just a moment')) {
      throw new Error(`Cloudflare challenge did not resolve for: ${url}`);
    }
  }
  return page.content();
}

/**
 * Extract category from detail page URL.
 * URL pattern: /wiki/toy-info/star-wars-original-kenner-series-{category-slug}-{item-slug}/{id}/
 * Matches the known category slug that appears after "original-kenner-series-".
 */
function extractCategoryFromUrl(url: string): string {
  for (const [slug, category] of Object.entries(CATEGORY_SLUG_MAP)) {
    if (url.includes(`-original-kenner-series-${slug}-`) ||
        url.includes(`-original-kenner-series-${slug}/`)) {
      return category;
    }
  }
  console.warn(`  Could not determine category from URL: ${url}`);
  return 'BASIC_FIGURE';
}

/** Extract the item's numeric ID from the URL (trailing /{id}/ segment). */
function extractExternalId(url: string): string {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? match[1] : '';
}

/**
 * Extract item name from the breadcrumb's trailing segment.
 * Breadcrumb: Home > Collector's Guides > Star Wars > Original Kenner Series > Basic Figures > Han Solo
 */
function extractName($: cheerio.CheerioAPI): string {
  // Look for a container holding multiple breadcrumb links that includes "Original Kenner Series"
  let name = '';
  $('*').each((_, el) => {
    const $el = $(el);
    // Skip elements with many children (nav bars) or too few links
    if ($el.find('a').length < 3 || $el.find('a').length > 10) return;
    const text = $el.text().trim();
    if (!text.includes('Original Kenner Series')) return;

    const parts = text.split('>');
    const lastPart = parts[parts.length - 1]?.trim();
    if (lastPart && lastPart.length > 0 && lastPart.length < 100) {
      name = lastPart;
      return false; // break
    }
  });

  if (name) return name;

  // Fallback: h1 heading — strip "Original Kenner Series SubGroup: " prefix
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
 * The first reference_images link in the sidebar is the main figure image.
 */
function extractCatalogImage($: cheerio.CheerioAPI): string | null {
  // Prefer sidebar/complementary first
  const aside = $('aside, [role="complementary"]').first();
  if (aside.length) {
    const href = aside.find('a[href*="/image/reference_images/"]').first().attr('href');
    if (href) return href.startsWith('http') ? href : `${BASE_URL}${href}`;
  }

  // Fallback: any reference_images link on the page
  const href = $('a[href*="/image/reference_images/"]').first().attr('href');
  if (href) return href.startsWith('http') ? href : `${BASE_URL}${href}`;

  return null;
}

/**
 * Extract accessories from the "Set Accessories" section.
 * Each entry reads like "DL-44 Blaster Pistol (bluish black) (x1)".
 * We strip the trailing "(xN)" quantity but keep color/variant descriptors.
 * Handles two DOM structures: wrapper (single container div) and flat (each sibling is one item).
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
      // Each item's structure: [img] [label div] [size/sold-out div]
      // The label is the first non-empty div that isn't a size/store entry
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
      label = label.replace(/\s*\(\s*x1\s*\)\s*$/, '').trim();

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

/**
 * Extract Kenner item number from the info table "ID:" row.
 * Returns null if the value is "(none)" or empty.
 */
function extractKennerItemNumber($: cheerio.CheerioAPI): string | null {
  let result: string | null = null;
  $('tr').each((_, row) => {
    const header = $(row).find('th').text().trim();
    if (header === 'ID:') {
      const value = $(row).find('td').text().trim();
      if (value && value !== '(none)') result = value;
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
      if (!isNaN(parsed) && parsed > 1970 && parsed < 2000) result = parsed;
      return false;
    }
  });
  return result;
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

  $('a[href*="/wiki/toy-info/star-wars-original-kenner-series-"]').each((_, el) => {
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
  const category = extractCategoryFromUrl(url);
  const name = extractName($);
  const catalogImageUrl = extractCatalogImage($);
  const accessories = extractAccessories($);
  const kennerItemNumber = extractKennerItemNumber($);
  const year = extractYear($);
  const figureSize = FIGURE_SIZE_BY_CATEGORY[category] ?? null;

  return {
    externalId,
    name,
    category,
    line: null,
    figureSize,
    accessories,
    isVariant: false,
    variantDescription: null,
    catalogImageUrl,
    sourceUrl: url,
    kennerItemNumber,
    year,
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

    // Set a realistic viewport and user agent
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
        console.log(`${progress} ${entry.name} (${entry.category})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${progress} ERROR ${url} — ${message}`);
        errors.push({ url, error: message });
      }

      // Rate limit — skip after last item
      if (i < total - 1) {
        await sleep(RATE_LIMIT_MS);
      }
    }

    // Write output
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
